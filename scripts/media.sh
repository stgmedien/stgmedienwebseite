#!/usr/bin/env bash
# Erzeugt aus dem Showreel-Master die Web-Fassungen und Standbilder für die Website.
# Aufruf: npm run media -- "/Pfad/zum/Master.mp4"
set -euo pipefail

SRC="${1:-/Volumes/Extreme SSD/Showreel STG Medien/06_EXPORT/02_Master/STG Medien Showreel.mp4}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media"

command -v ffmpeg >/dev/null || { echo "ffmpeg fehlt: brew install ffmpeg"; exit 1; }
[ -f "$SRC" ] || { echo "Master nicht gefunden: $SRC"; exit 1; }
mkdir -p "$OUT/stills"

# Web-Fassungen: 1080p für Desktop, 720p fürs Handy. Die Seite startet stumm, die Musik bleibt als Tonspur.
ffmpeg -v error -y -i "$SRC" -vf "scale=1920:-2:flags=lanczos" -c:v libx264 -profile:v high -preset slow -crf 23 \
  -maxrate 6M -bufsize 12M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$OUT/showreel-1080.mp4"
ffmpeg -v error -y -i "$SRC" -vf "scale=1280:-2:flags=lanczos" -c:v libx264 -profile:v high -preset slow -crf 25 \
  -maxrate 3M -bufsize 6M -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "$OUT/showreel-720.mp4"

# Standbilder als Name:Sekunde. Nach einem neuen Schnitt die Zeitpunkte hier anpassen.
STILLS=(
  "poster:0.05"
  "fotos:1.0"
  "drohne:19.6"
  "video:16.5"
  "grundriss:9.0"
  "staging-vorher:10.5"
  "staging-nachher:13.5"
  "expose:5.4"
  "portal:23.0"
  "projekt-1:3.3"
  "projekt-2:2.4"
  "projekt-3:15.2"
  "projekt-4:7.8"
  "projekt-5:26.0"
)
for s in "${STILLS[@]}"; do
  name="${s%%:*}"; t="${s##*:}"
  ffmpeg -v error -y -ss "$t" -i "$SRC" -frames:v 1 -vf "scale=1600:-2:flags=lanczos" -q:v 4 "$OUT/stills/$name.jpg"
done

ls -lh "$OUT" "$OUT/stills"
