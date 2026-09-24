#!/usr/bin/env python3
"""
Turin Seminar 2026 — Batch Image Compression & Pipeline Automation
Executes Step 1:
- Backs up original raw/master images to untracked `_originals_backup/`
- Compresses web versions using native macOS `sips`:
  * Max long edge: 1920px (preserving aspect ratio)
  * Format: JPEG
  * Quality: ~80% (target ~250-400KB)
  * Systematic naming: {prefix}-01.jpg, {prefix}-02.jpg, ...
- Dynamically detects resulting files, measures dimensions, and writes structured records into content.json
"""

import os
import sys
import shutil
import subprocess
import json
import re

WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP_DIR = os.path.join(WORKSPACE_ROOT, "_originals_backup")
CONTENT_JSON_PATH = os.path.join(WORKSPACE_ROOT, "content.json")

CHAPTER_CONFIG = [
    {
        "id": "chapter-1",
        "category": "seminar",
        "folder": "images/seminar",
        "prefix": "seminar",
        "plate_num": "01",
        "title_template": "Семинарская сессия: фрагмент {i}",
        "title_it_template": "Sessione Seminariale: Frammento {i}",
        "desc_template": "NH Santo Stefano. Дискуссия о трехмерной модели власти и хронополитических режимах современности (кадр {i}).",
        "desc_it_template": "NH Santo Stefano. Disputa sul modello tridimensionale del potere e la cronopolitica (fotogramma {i}).",
        "tag": "Вводная лекция / Lezione Introduttiva"
    },
    {
        "id": "chapter-2",
        "category": "risorgimento",
        "folder": "images/risorgimento",
        "prefix": "risorgimento",
        "plate_num": "02",
        "title_template": "Палаццо Кариньяно и Рисорджименто: фрагмент {i}",
        "title_it_template": "Palazzo Carignano e Risorgimento: Frammento {i}",
        "desc_template": "Историческая память и Савойский трон: музейный анализ артефактов объединения Италии (кадр {i}).",
        "desc_it_template": "Memoria storica e il trono sabaudo: analisi museale dei reperti dell'Unità (fotogramma {i}).",
        "tag": "Палаццо Кариньяно / Carignano"
    },
    {
        "id": "chapter-3",
        "category": "lombroso",
        "folder": "images/lombroso",
        "prefix": "lombroso",
        "plate_num": "03",
        "title_template": "Музей Чезаре Ломброзо: фрагмент {i}",
        "title_it_template": "Museo Cesare Lombroso: Frammento {i}",
        "desc_template": "Анатомия надзора и криминологический позитивизм: деконструкция биополитики XIX века (кадр {i}).",
        "desc_it_template": "Anatomia della sorveglianza e positivismo criminologico: decostruzione della biopolitica ottocentesca (fotogramma {i}).",
        "tag": "Музей Ломброзо / Lombroso"
    },
    {
        "id": "chapter-4",
        "category": "city",
        "folder": "images/city",
        "prefix": "city",
        "plate_num": "04",
        "title_template": "Городские портики и площади: фрагмент {i}",
        "title_it_template": "Portici e Piazze di Torino: Frammento {i}",
        "desc_template": "Философский дрейф по регулярному городу: аркады Виа По, Пьяцца Сан-Карло и берега По (кадр {i}).",
        "desc_it_template": "Deriva filosofica nella città razionale: portici di Via Po e sponde del Po (fotogramma {i}).",
        "tag": "Туринские аркады / Portici"
    }
]

SPAN_CYCLE = ["span-7", "span-5", "span-4", "span-8", "span-6", "span-6"]

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def get_image_dimensions(filepath):
    """Uses sips to query pixelWidth and pixelHeight."""
    try:
        out = subprocess.check_output(
            ["/usr/bin/sips", "-g", "pixelWidth", "-g", "pixelHeight", filepath],
            stderr=subprocess.DEVNULL
        ).decode("utf-8")
        width = None
        height = None
        for line in out.splitlines():
            if "pixelWidth:" in line:
                width = int(line.split("pixelWidth:")[1].strip())
            elif "pixelHeight:" in line:
                height = int(line.split("pixelHeight:")[1].strip())
        return width, height
    except Exception as e:
        print(f"Warning: could not get dimensions for {filepath}: {e}")
        return None, None

def determine_aspect(width, height):
    if not width or not height:
        return "aspect-wide"
    ratio = width / height
    if ratio > 1.25:
        return "aspect-wide"
    elif ratio < 0.88:
        return "aspect-tall"
    else:
        return "aspect-square"

def main():
    print("=== TURIN SEMINAR PHOTO PIPELINE: STEP 1 BATCH COMPRESSION ===")
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    # Load content.json
    with open(CONTENT_JSON_PATH, "r", encoding="utf-8") as f:
        content_data = json.load(f)
    
    chapters_map = {ch["id"]: ch for ch in content_data.get("chapters", [])}
    
    total_processed = 0
    
    for cfg in CHAPTER_CONFIG:
        ch_id = cfg["id"]
        category = cfg["category"]
        prefix = cfg["prefix"]
        folder_rel = cfg["folder"]
        folder_abs = os.path.join(WORKSPACE_ROOT, folder_rel)
        backup_cat_dir = os.path.join(BACKUP_DIR, category)
        os.makedirs(backup_cat_dir, exist_ok=True)
        
        if not os.path.exists(folder_abs):
            print(f"Folder not found: {folder_abs}")
            continue
            
        # Find all current image files
        all_entries = os.listdir(folder_abs)
        raw_files = [
            f for f in all_entries 
            if not f.startswith('.') and f.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp'))
        ]
        raw_files.sort(key=natural_sort_key)
        
        print(f"\n--- Processing {category} ({len(raw_files)} master files) ---")
        
        # Step 1.1: Backup original raw files to _originals_backup
        for rf in raw_files:
            src = os.path.join(folder_abs, rf)
            dst = os.path.join(backup_cat_dir, rf)
            if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src):
                shutil.copy2(src, dst)
        print(f"  ✓ Backed up {len(raw_files)} files to _originals_backup/{category}/")
        
        # Step 1.2: Process each image into a temporary directory, then place into folder
        temp_proc_dir = os.path.join(WORKSPACE_ROOT, f"_tmp_{category}")
        os.makedirs(temp_proc_dir, exist_ok=True)
        
        resulting_files = []
        
        for idx, rf in enumerate(raw_files, start=1):
            source_backup = os.path.join(backup_cat_dir, rf)
            new_filename = f"{prefix}-{idx:02d}.jpg"
            dest_temp = os.path.join(temp_proc_dir, new_filename)
            
            # Sips command:
            # -s format jpeg
            # -s formatOptions 80
            # -Z 1920 (max long edge 1920 preserving aspect ratio)
            cmd = [
                "/usr/bin/sips",
                "-s", "format", "jpeg",
                "-s", "formatOptions", "80",
                "-Z", "1920",
                source_backup,
                "--out", dest_temp
            ]
            
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            if res.returncode != 0:
                print(f"  ✗ Error converting {rf}: {res.stderr.decode('utf-8')}")
                continue
                
            file_size_kb = os.path.getsize(dest_temp) / 1024.0
            resulting_files.append((idx, new_filename, dest_temp, file_size_kb))
            
        print(f"  ✓ Converted {len(resulting_files)} images (max 1920px, JPEG 80%)")
        
        # Clean up old raw files in web folder, move converted files in
        for entry in os.listdir(folder_abs):
            if not entry.startswith('.'):
                target_path = os.path.join(folder_abs, entry)
                if os.path.isfile(target_path):
                    os.remove(target_path)
                    
        for idx, new_filename, dest_temp, file_size_kb in resulting_files:
            final_path = os.path.join(folder_abs, new_filename)
            shutil.move(dest_temp, final_path)
            
        # Clean up temp dir
        shutil.rmtree(temp_proc_dir, ignore_errors=True)
        print(f"  ✓ Placed web assets into {folder_rel}/ systematically as {prefix}-01.jpg ..")
        
        # Step 1.3: Detect exact resulting files and write structured array to content.json
        final_files = [
            f for f in sorted(os.listdir(folder_abs), key=natural_sort_key)
            if f.endswith('.jpg')
        ]
        
        if ch_id in chapters_map:
            chapter = chapters_map[ch_id]
            chapter["count"] = len(final_files)
            if "gallery_config" not in chapter:
                chapter["gallery_config"] = {}
            chapter["gallery_config"]["folder"] = f"{folder_rel}/"
            chapter["gallery_config"]["prefix"] = f"{prefix}-"
            chapter["gallery_config"]["count"] = len(final_files)
            chapter["gallery_config"]["extension"] = ".jpg"
            
            existing_images = {img.get("number"): img for img in chapter.get("images", [])}
            
            new_image_records = []
            for i, fname in enumerate(final_files, start=1):
                img_path = os.path.join(folder_abs, fname)
                w, h = get_image_dimensions(img_path)
                aspect = determine_aspect(w, h)
                span = SPAN_CYCLE[(i - 1) % len(SPAN_CYCLE)]
                
                # Check if we have existing titles/descriptions to preserve
                existing = existing_images.get(i, {})
                title = existing.get("title") or cfg["title_template"].format(i=i)
                title_it = existing.get("title_it") or cfg["title_it_template"].format(i=i)
                desc = existing.get("desc") or cfg["desc_template"].format(i=i)
                desc_it = existing.get("desc_it") or cfg["desc_it_template"].format(i=i)
                tag = existing.get("tag") or cfg["tag"]
                
                record = {
                    "id": f"{prefix}-{i:02d}",
                    "plate": f"PL. {cfg['plate_num']}.{i:02d}",
                    "number": i,
                    "src": f"{folder_rel}/{fname}",
                    "aspect": aspect,
                    "span": span,
                    "title": title,
                    "title_it": title_it,
                    "desc": desc,
                    "desc_it": desc_it,
                    "tag": tag
                }
                new_image_records.append(record)
                
            chapter["images"] = new_image_records
            print(f"  ✓ Dynamic catalog updated: {len(new_image_records)} photo records for {ch_id}")
            total_processed += len(new_image_records)

    # Save content.json
    with open(CONTENT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(content_data, f, ensure_ascii=False, indent=2)
    print(f"\n✓ Successfully updated {CONTENT_JSON_PATH} with {total_processed} total photos across all 4 chapters!")

if __name__ == "__main__":
    main()
