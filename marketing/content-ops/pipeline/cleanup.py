"""Zero-bloat Media and Cache Cleanup Engine.

Ensures that rendered canvas and promotional PNG images, specs, and memory buffers
are deleted as soon as content is published to X or Telegram.
Frees disk space, keeps the repository lightweight, and releases Python memory via garbage collection.
"""
from __future__ import annotations

import gc
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from . import queue

logger = logging.getLogger("cleanup")


def _resolve_paths(entry: Dict[str, Any], date_str: str, suffix: str = "") -> List[Path]:
    """Finds all potential on-disk paths for an entry's media and spec files."""
    stem = f"{entry['id']}{suffix}"
    date_dir = queue.QUEUE / date_str
    candidates = [
        date_dir / f"{stem}.png",
        date_dir / f"{stem}.spec.json",
    ]
    # Also check if explicit path was stored in entry
    explicit = entry.get("image") if not suffix else entry.get("reveal", {}).get("image")
    if explicit:
        p = Path(explicit)
        if p.is_absolute():
            candidates.append(p)
        else:
            candidates.append(queue.ROOT / p)
            candidates.append(queue.HERE / p)

    unique_paths = []
    seen = set()
    for c in candidates:
        resolved = str(c.resolve()) if c.exists() else str(c)
        if resolved not in seen:
            seen.add(resolved)
            unique_paths.append(c)
    return unique_paths


def cleanup_post_media(
    entry: Dict[str, Any],
    delete_reveal: bool = False,
    dry_run: bool = False,
) -> List[str]:
    """Deletes the rendered image and spec files for a published post and frees memory.

    Args:
        entry: The queue entry dict.
        delete_reveal: If True, also deletes any reveal image. If False, only deletes reveal
                       if reveal['sent'] is already marked.
        dry_run: If True, returns paths without unlinking.

    Returns:
        List of deleted file paths.
    """
    eid = entry.get("id", "unknown")
    date_str = entry.get("date", eid[:10])
    deleted: List[str] = []

    # 1. Main post media
    main_paths = _resolve_paths(entry, date_str, suffix="")
    for p in main_paths:
        if p.exists() and p.is_file():
            if not dry_run:
                try:
                    p.unlink(missing_ok=True)
                    deleted.append(str(p))
                except Exception as e:
                    logger.warning(f"Could not unlink {p}: {e}")
            else:
                deleted.append(str(p))

    # 2. Reveal media (if requested or already sent)
    reveal = entry.get("reveal")
    should_delete_reveal = delete_reveal or (reveal and bool(reveal.get("sent")))
    if should_delete_reveal and reveal:
        reveal_paths = _resolve_paths(entry, date_str, suffix=".reveal")
        for p in reveal_paths:
            if p.exists() and p.is_file():
                if not dry_run:
                    try:
                        p.unlink(missing_ok=True)
                        deleted.append(str(p))
                    except Exception as e:
                        logger.warning(f"Could not unlink reveal file {p}: {e}")
                else:
                    deleted.append(str(p))

    if not dry_run:
        # Clear local image references to keep entry lightweight
        entry.pop("image", None)
        if should_delete_reveal and reveal:
            reveal.pop("image", None)
        entry["media_cleaned"] = True
        try:
            queue.save(entry)
        except Exception as e:
            logger.warning(f"Could not save entry after media cleanup: {e}")

        # Explicit garbage collection to release image buffers from memory
        gc.collect()

    return deleted


def purge_published_media(dry_run: bool = False) -> Dict[str, Any]:
    """Scans the entire queue and purges all media for published posts.

    Also cleans any orphaned .spec.json temporary render files.
    """
    all_entries = queue.all_entries()
    total_bytes_freed = 0
    deleted_files: List[str] = []
    cleaned_entries_count = 0

    for entry in all_entries:
        if entry.get("status") == "published":
            reveal = entry.get("reveal")
            has_unsent_reveal = bool(reveal and not reveal.get("sent"))
            # If there's an unsent reveal, keep the reveal image but delete the main image
            deleted = cleanup_post_media(
                entry,
                delete_reveal=not has_unsent_reveal,
                dry_run=dry_run,
            )
            if deleted:
                cleaned_entries_count += 1
                for f_path in deleted:
                    p = Path(f_path)
                    try:
                        if dry_run and p.exists():
                            total_bytes_freed += p.stat().st_size
                    except Exception:
                        pass
                    deleted_files.append(f_path)

    # 3. Clean up any remaining orphaned .spec.json files across all queue folders
    for spec_file in queue.QUEUE.glob("*/*.spec.json"):
        try:
            size = spec_file.stat().st_size
            if not dry_run:
                spec_file.unlink(missing_ok=True)
            total_bytes_freed += size
            deleted_files.append(str(spec_file))
        except Exception as e:
            logger.warning(f"Could not unlink orphan spec {spec_file}: {e}")

    # Force memory garbage collection
    gc.collect()

    return {
        "dry_run": dry_run,
        "files_deleted": len(deleted_files),
        "deleted_paths": deleted_files,
        "bytes_freed": total_bytes_freed,
        "mb_freed": round(total_bytes_freed / (1024 * 1024), 2),
        "entries_cleaned": cleaned_entries_count,
    }
