#!/bin/bash

# ============================================================
# convert_images.sh
# Converts ALL images in ./images/ to JPG and renames to 1.jpg, 2.jpg, etc.
# Supports: HEIC, PNG, WEBP, BMP, TIFF, GIF, AVIF, SVG, JPEG
# ============================================================

set -e

IMG_DIR="./images"
QUALITY=92

# ── Check dependencies ──
echo "🔍 Checking dependencies..."

MISSING=()
if ! command -v convert &>/dev/null; then
  MISSING+=("imagemagick")
fi
if ! command -v heif-convert &>/dev/null; then
  MISSING+=("libheif-examples")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "❌ Missing packages: ${MISSING[*]}"
  echo ""
  echo "Install them with:"
  echo "  sudo apt update && sudo apt install -y ${MISSING[*]}"
  echo ""
  echo "  -- or on Fedora --"
  echo "  sudo dnf install ${MISSING[*]}"
  echo ""
  exit 1
fi

echo "✅ All dependencies found."

# ── Validate directory ──
if [ ! -d "$IMG_DIR" ]; then
  echo "❌ Directory '$IMG_DIR' not found. Run this script from the folder containing your /images directory."
  exit 1
fi

# Count source files
TOTAL=$(find "$IMG_DIR" -maxdepth 1 -type f \( \
  -iname "*.heic" -o -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \
  -o -iname "*.webp" -o -iname "*.bmp" -o -iname "*.tiff" -o -iname "*.tif" \
  -o -iname "*.gif" -o -iname "*.avif" -o -iname "*.svg" \
\) | wc -l)

if [ "$TOTAL" -eq 0 ]; then
  echo "❌ No image files found in $IMG_DIR"
  exit 1
fi

echo "📸 Found $TOTAL image(s) in $IMG_DIR"
echo ""

# ── Create temp working directory ──
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# ── Convert everything ──
COUNT=0
FAILED=0

# Sort files for consistent ordering
find "$IMG_DIR" -maxdepth 1 -type f \( \
  -iname "*.heic" -o -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \
  -o -iname "*.webp" -o -iname "*.bmp" -o -iname "*.tiff" -o -iname "*.tif" \
  -o -iname "*.gif" -o -iname "*.avif" -o -iname "*.svg" \
\) | sort | while read -r FILE; do
  COUNT_FILE="$TEMP_DIR/.count"
  FAIL_FILE="$TEMP_DIR/.fail"

  # Read current count
  if [ -f "$COUNT_FILE" ]; then
    COUNT=$(cat "$COUNT_FILE")
  fi
  if [ -f "$FAIL_FILE" ]; then
    FAILED=$(cat "$FAIL_FILE")
  fi

  COUNT=$((COUNT + 1))
  BASENAME=$(basename "$FILE")
  EXT="${BASENAME##*.}"
  EXT_LOWER=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')
  OUTPUT="$TEMP_DIR/${COUNT}.jpg"

  echo -n "  [$COUNT/$TOTAL] $BASENAME → ${COUNT}.jpg ... "

  # HEIC/HEIF: use heif-convert first, then ImageMagick to ensure JPG
  if [[ "$EXT_LOWER" == "heic" || "$EXT_LOWER" == "heif" ]]; then
    HEIF_TMP="$TEMP_DIR/heif_tmp_${COUNT}.jpg"
    if heif-convert -q $QUALITY "$FILE" "$HEIF_TMP" &>/dev/null; then
      # heif-convert may output multiple files for multi-frame, grab first
      ACTUAL=$(ls "$TEMP_DIR"/heif_tmp_${COUNT}*.jpg 2>/dev/null | head -1)
      if [ -n "$ACTUAL" ]; then
        mv "$ACTUAL" "$OUTPUT"
        # Clean up any extra frames
        rm -f "$TEMP_DIR"/heif_tmp_${COUNT}*.jpg 2>/dev/null
        echo "✅"
      else
        echo "❌ (heif-convert produced no output)"
        FAILED=$((FAILED + 1))
        COUNT=$((COUNT - 1))
      fi
    else
      echo "❌ (heif-convert failed)"
      FAILED=$((FAILED + 1))
      COUNT=$((COUNT - 1))
    fi

  # Already JPEG: just copy (re-encode to standardize)
  elif [[ "$EXT_LOWER" == "jpg" || "$EXT_LOWER" == "jpeg" ]]; then
    if convert "$FILE" -quality $QUALITY "$OUTPUT" 2>/dev/null; then
      echo "✅"
    else
      echo "❌"
      FAILED=$((FAILED + 1))
      COUNT=$((COUNT - 1))
    fi

  # Everything else: PNG, WEBP, BMP, TIFF, GIF, AVIF, SVG
  else
    if convert "$FILE" -flatten -quality $QUALITY "$OUTPUT" 2>/dev/null; then
      echo "✅"
    else
      echo "❌"
      FAILED=$((FAILED + 1))
      COUNT=$((COUNT - 1))
    fi
  fi

  echo "$COUNT" > "$COUNT_FILE"
  echo "$FAILED" > "$FAIL_FILE"
done

# Read final counts
FINAL_COUNT=0
FINAL_FAILED=0
[ -f "$TEMP_DIR/.count" ] && FINAL_COUNT=$(cat "$TEMP_DIR/.count")
[ -f "$TEMP_DIR/.fail" ] && FINAL_FAILED=$(cat "$TEMP_DIR/.fail")

# ── Verify we got output ──
JPG_COUNT=$(find "$TEMP_DIR" -maxdepth 1 -name "*.jpg" | wc -l)

if [ "$JPG_COUNT" -eq 0 ]; then
  echo ""
  echo "❌ No images were converted successfully."
  exit 1
fi

# ── Replace originals ──
echo ""
read -p "🗑️  Delete originals and replace with $JPG_COUNT numbered JPGs? (y/N) " CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  # Remove all old images
  find "$IMG_DIR" -maxdepth 1 -type f \( \
    -iname "*.heic" -o -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \
    -o -iname "*.webp" -o -iname "*.bmp" -o -iname "*.tiff" -o -iname "*.tif" \
    -o -iname "*.gif" -o -iname "*.avif" -o -iname "*.svg" \
  \) -delete

  # Move converted files in
  mv "$TEMP_DIR"/*.jpg "$IMG_DIR/"

  echo ""
  echo "🎉 Done! $JPG_COUNT images ready in $IMG_DIR/"
  echo ""
  ls -1 "$IMG_DIR"/*.jpg | head -20
  [ "$JPG_COUNT" -gt 20 ] && echo "  ... and $((JPG_COUNT - 20)) more"
else
  echo "❌ Cancelled. Originals untouched. Converted files discarded."
fi

echo ""
if [ "$FINAL_FAILED" -gt 0 ]; then
  echo "⚠️  $FINAL_FAILED file(s) failed to convert."
fi
echo "✨ All set for your birthday card!"