#!/data/data/com.termux/files/usr/bin/bash

echo "🧱 C13B0 — Mario SNES Preview Fix"

REPO=~/MARIO-TOKENS
PAGE=pages/snes-emulator.html
BACKUP=pages/snes-emulator_backup.html

cd $REPO || { echo "Repo not found"; exit 1; }

echo "📦 backup page"
cp $PAGE $BACKUP

echo "🧠 inserting preview metadata"

awk '
/<head>/{
print;
print "    <!-- social preview metadata -->";
print "    <meta property=\"og:title\" content=\"Mario SNES Emulator\">";
print "    <meta property=\"og:description\" content=\"Play SNES Mario games directly in the browser\">";
print "    <meta property=\"og:image\" content=\"https://pewpi-infinity.github.io/MARIO-TOKENS/images/snes-preview.png\">";
print "    <meta property=\"og:url\" content=\"https://pewpi-infinity.github.io/MARIO-TOKENS/pages/snes-emulator.html\">";
print "    <meta property=\"og:type\" content=\"website\">";
print "    <meta name=\"twitter:card\" content=\"summary_large_image\">";
print "    <meta name=\"twitter:title\" content=\"Mario SNES Emulator\">";
print "    <meta name=\"twitter:description\" content=\"Play SNES Mario games directly in your browser\">";
print "    <meta name=\"twitter:image\" content=\"https://pewpi-infinity.github.io/MARIO-TOKENS/images/snes-preview.png\">";
next
}1' $PAGE > temp.html

mv temp.html $PAGE

echo "📡 committing"
git add .
git commit -m "C13B0: add SNES emulator social preview metadata"
git push

echo ""
echo "✅ DONE"
echo "Refresh preview at:"
echo "https://cards-dev.twitter.com/validator"

