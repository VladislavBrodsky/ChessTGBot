import re

def fix_migration(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Very naive fix for this specific file to remove all op.alter_column calls inside upgrade()
    if 'def upgrade() -> None:' in content:
        lines = content.split('\n')
        new_lines = []
        skip = False
        for line in lines:
            if 'op.alter_column' in line:
                skip = True
                continue
            if skip and line.strip().startswith('existing_type='):
                continue
            if skip and line.strip().startswith('nullable='):
                continue
            if skip and line.strip() == ')':
                skip = False
                continue
            if skip and line.strip().startswith('type_='):
                continue
            if skip and line.strip().startswith('existing_nullable='):
                continue
            if not skip:
                new_lines.append(line)
        
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))

fix_migration('alembic/versions/54ef1913c988_add_broadcasts_table.py')
fix_migration('alembic/versions/d1a2b3c4d5e6_repair_schema.py')
