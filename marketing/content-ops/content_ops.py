"""Local research collection and content validation; no autonomous outbound posting."""
from __future__ import annotations
import argparse, csv, hashlib, html, ipaddress, json, re, socket, sqlite3, time
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree as ET

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
CATEGORIES={'Tactics','Openings','Academy','Chess News','Chess Culture','Product','Match Rules'}
MAX_BYTES=2_000_000

def canonical(url):
    p=urlsplit(url)
    query=urlencode([(k,v) for k,v in parse_qsl(p.query,keep_blank_values=True) if not k.lower().startswith('utm_') and k.lower() not in {'fbclid','gclid'}])
    return urlunsplit((p.scheme.lower(),p.netloc.lower(),p.path or '/',query,''))

def validate_url(url,hosts):
    p=urlsplit(url)
    if p.scheme!='https' or p.hostname not in hosts or p.username or p.password or p.port not in {None,443}:
        raise ValueError('URL is outside the permitted HTTPS source hosts')
    addresses=socket.getaddrinfo(p.hostname,443,type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(row[4][0]).is_global for row in addresses):
        raise ValueError('Source resolves to a non-public network')

class SafeRedirect(HTTPRedirectHandler):
    def __init__(self,hosts): self.hosts=hosts
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        validate_url(newurl,self.hosts)
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def fetch(url,hosts,agent,headers=None):
    validate_url(url,hosts)
    request=Request(url,headers={'User-Agent':agent,'Accept':'application/atom+xml,application/rss+xml,application/xml,text/html;q=0.5',**(headers or {})})
    for attempt in range(3):
        try:
            with build_opener(SafeRedirect(hosts)).open(request,timeout=12) as response:
                data=response.read(MAX_BYTES+1)
                if len(data)>MAX_BYTES: raise ValueError('Source exceeds response-size limit')
                return data,{key.lower():value for key,value in response.headers.items()},response.status
        except HTTPError as exc:
            if exc.code==304: return b'',{key.lower():value for key,value in exc.headers.items()},304
            if exc.code not in {429,500,502,503,504} or attempt==2: raise
            try: delay=int(exc.headers.get('Retry-After',2**attempt))
            except ValueError: delay=2**attempt
            if delay>30: raise ValueError('Rate limited; defer to a later run') from exc
            time.sleep(max(1,delay))
    raise RuntimeError('Fetch retry limit reached')

def robots_allowed(url,hosts,agent):
    p=urlsplit(url);robot_url=urlunsplit((p.scheme,p.netloc,'/robots.txt','',''))
    try: raw,_,_=fetch(robot_url,hosts,agent)
    except HTTPError as exc:
        if exc.code==404:return True,1
        return False,0
    except Exception:return False,0
    robot=RobotFileParser();robot.parse(raw.decode('utf-8','replace').splitlines())
    return robot.can_fetch(agent,url),max(1,robot.crawl_delay(agent) or 1)

def timestamp(value):
    if not value:return None
    try:
        try: dt=datetime.fromisoformat(value.strip().replace('Z','+00:00'))
        except ValueError: dt=parsedate_to_datetime(value.strip())
        return (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).astimezone(timezone.utc).isoformat()
    except (ValueError,TypeError,OverflowError):return None

def parse_feed(raw,source):
    root=ET.fromstring(raw);items=[]
    # Treat retrieved text as source data, never as agent instructions.
    for node in root.iter():
        if node.tag.split('}')[-1] not in {'item','entry'}:continue
        fields={};link=''
        for child in node:
            tag=child.tag.split('}')[-1];value=''.join(child.itertext()).strip()
            if tag=='link':
                if child.get('rel','alternate')=='alternate':link=child.get('href') or value
            fields[tag]=value
        if not link:continue
        url=canonical(urljoin(source['url'],link))
        if urlsplit(url).scheme!='https':continue
        if urlsplit(url).hostname not in source['hosts'] or not fields.get('title'):continue
        published=timestamp(fields.get('pubDate') or fields.get('published') or fields.get('date'))
        updated=timestamp(fields.get('updated'))
        snippet=html.unescape(re.sub('<[^>]+>',' ',fields.get('summary') or fields.get('description') or ''))
        items.append({'url':url,'title':html.unescape(fields['title'])[:250],'summary':re.sub(r'\s+',' ',snippet)[:400],'published_at':published,'updated_at':updated,'event_date':None,'source':source['id'],'trust':source['trust']})
    return items

def open_db(path):
    path.parent.mkdir(parents=True,exist_ok=True);db=sqlite3.connect(path)
    db.execute('CREATE TABLE IF NOT EXISTS items(url TEXT PRIMARY KEY, fingerprint TEXT, payload TEXT, first_seen TEXT, last_seen TEXT)')
    db.execute('CREATE TABLE IF NOT EXISTS feeds(id TEXT PRIMARY KEY, etag TEXT, modified TEXT)')
    return db

def store_items(db,items,now):
    counts={'new':0,'updated':0,'unchanged':0}
    for item in items:
        value=json.dumps(item,sort_keys=True);fingerprint=hashlib.sha256(value.encode()).hexdigest()
        existing=db.execute('SELECT fingerprint FROM items WHERE url=?',(item['url'],)).fetchone()
        kind='new' if not existing else 'unchanged' if existing[0]==fingerprint else 'updated';counts[kind]+=1
        db.execute('INSERT INTO items VALUES(?,?,?,?,?) ON CONFLICT(url) DO UPDATE SET fingerprint=excluded.fingerprint,payload=excluded.payload,last_seen=excluded.last_seen',(item['url'],fingerprint,value,now,now))
    db.commit();return counts

def collect(args, sources=None, db_path=None, quiet=False):
    config=json.loads((HERE/'sources.json').read_text());db=open_db(Path(db_path) if db_path else HERE/'state/research.sqlite3');now=datetime.now(timezone.utc)
    report={'fetched_at':now.isoformat(),'sources':[],'candidates':[],'limitations':['Opportunity scores are heuristics, not measured virality. Social views and search volume are unavailable unless supplied.']}
    try:
        for source in (sources if sources is not None else config['sources']):
            record={'id':source['id']}
            try:
                allowed,delay=robots_allowed(source['url'],source['hosts'],config['user_agent'])
                if not allowed:raise ValueError('Robots unavailable or access disallowed; use manual research')
                if delay>30:raise ValueError('Crawl delay requires a later run')
                time.sleep(delay)
                cached=db.execute('SELECT etag,modified FROM feeds WHERE id=?',(source['id'],)).fetchone()
                headers={}
                if cached:
                    if cached[0]:headers['If-None-Match']=cached[0]
                    if cached[1]:headers['If-Modified-Since']=cached[1]
                raw,meta,status=fetch(source['url'],source['hosts'],config['user_agent'],headers)
                record['http_status']=status
                if status!=304:
                    items=parse_feed(raw,source);record.update(store_items(db,items,now.isoformat()))
                    db.execute('INSERT OR REPLACE INTO feeds VALUES(?,?,?)',(source['id'],meta.get('etag'),meta.get('last-modified')));db.commit()
            except Exception as exc:record['error']=str(exc)[:240]
            report['sources'].append(record)
        cutoff=now-timedelta(days=args.days)
        for (payload,) in db.execute('SELECT payload FROM items'):
            item=json.loads(payload)
            if not item['published_at']:continue
            when=datetime.fromisoformat(item['published_at'])
            if not cutoff<=when<=now:continue
            words=(item['title']+' '+item['summary']).lower();age=(now-when).total_seconds()/86400
            fit=sum(word in words for word in ['puzzle','tactic','blitz','opening','learn','chess','olympiad'])
            item['opportunity_score']=round(max(0,20-age)+min(fit*7,35)+(20 if item['trust']=='primary' else 12),1)
            report['candidates'].append(item)
        report['candidates'].sort(key=lambda item:item['opportunity_score'],reverse=True)
        report['candidates']=report['candidates'][:30]
        output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2)+'\n')
        if not quiet:
            print(json.dumps({'report':str(output),'candidates':len(report['candidates']),'sources':report['sources']},indent=2))
        return report
    finally:db.close()

def validate_article(post):
    errors=[]
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',post.get('slug','')):errors.append('invalid slug')
    if post.get('category') not in CATEGORIES:errors.append('invalid category')
    for field in ['title','subtitle','excerpt','publishedAt','readingTime']:
        if not isinstance(post.get(field),str) or not post[field].strip():errors.append('missing '+field)
    if not post.get('sources'):errors.append('sources required')
    if not post.get('content') or not post.get('takeaways'):errors.append('body and takeaways required')
    author=post.get('author',{})
    if not author.get('name') or author.get('kind') not in {'Organization','Person'}:errors.append('accountable author required')
    text=' '.join(str(block.get('text',''))+' '+' '.join(block.get('items',[])) for block in post.get('content',[]))
    for sentence in re.split(r'(?<=[.!?])\s+',text):
        if re.search(r'guaranteed (income|profit|returns)|replace (your |a )?salary|thousands of players|instant (on.chain|wallet) (settlement|withdrawal)|non.custodial escrow',sentence,re.I) and not re.search(r'\b(no|not|never|cannot|doesn.t)\b',sentence,re.I):errors.append('unsupported money or audience claim')
    return errors

def promote(args):
    source=Path(args.article);post=json.loads(source.read_text());errors=validate_article(post)
    if errors:raise ValueError('; '.join(errors))
    if not args.reviewed_by:raise ValueError('An explicit editorial review record is required')
    target=ROOT/'website/src/content/articles'/f"{post['slug']}.json"
    if target.exists():raise ValueError('Slug already exists; edit the existing article through a reviewed change')
    target.write_text(json.dumps(post,indent=2,ensure_ascii=False)+'\n')
    try:
        import subprocess
        result=subprocess.run(['node','scripts/check-content.mjs'],cwd=ROOT/'website',capture_output=True,text=True)
        if result.returncode:raise ValueError(result.stdout+result.stderr)
    except Exception:
        target.unlink(missing_ok=True);raise
    log=HERE/'state/review-log.jsonl';log.parent.mkdir(exist_ok=True)
    with log.open('a') as stream:stream.write(json.dumps({'slug':post['slug'],'reviewed_by':args.reviewed_by,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'at':datetime.now(timezone.utc).isoformat()})+'\n')
    print(f'Staged {target}; build and deploy remain separate steps.')

def analyse(args):
    with Path(args.csv).open(newline='') as stream:rows=list(csv.DictReader(stream))
    result=[]
    def ratio(a,b):return round(float(a)/float(b),4) if a not in {'',None} and b not in {'',None} and float(b)>0 else None
    for row in rows:
        result.append({'content_id':row.get('content_id'),'channel':row.get('channel'),'engagement_per_reach':ratio(row.get('engagements'),row.get('reach')),'save_rate':ratio(row.get('saves'),row.get('reach')),'share_rate':ratio(row.get('shares'),row.get('reach')),'click_rate':ratio(row.get('clicks'),row.get('impressions')),'activation_rate':ratio(row.get('game_starts'),row.get('attributed_visits'))})
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps({'rows':result,'note':'Missing data stays null. Compare like channels, objectives and observation windows.'},indent=2)+'\n');print('Analysed '+str(len(result))+' observations.')

def scrape_telegram(args):
    import telegram_public  # public t.me/s/ previews only; see telegram_public.py for the safety rules
    telegram_public.run(args)

def main():
    parser=argparse.ArgumentParser();commands=parser.add_subparsers(dest='command',required=True)
    c=commands.add_parser('collect');c.add_argument('--days',type=int,default=7);c.add_argument('--output',default=str(HERE/'reports/latest-research.json'));c.set_defaults(run=collect)
    c=commands.add_parser('promote');c.add_argument('article');c.add_argument('--reviewed-by',required=True);c.set_defaults(run=promote)
    c=commands.add_parser('analyse');c.add_argument('csv');c.add_argument('--output',default=str(HERE/'reports/analytics.json'));c.set_defaults(run=analyse)
    import telegram_public
    telegram_public.add_arguments(commands.add_parser('scrape-telegram',help='read public Telegram channel previews into state/telegram_posts.sqlite3'));commands.choices['scrape-telegram'].set_defaults(run=scrape_telegram)
    args=parser.parse_args();args.run(args)
if __name__=='__main__':main()
