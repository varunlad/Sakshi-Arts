#!/usr/bin/env python3
import os

def create_file(path, content):
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"  [+] Updated: {path}")

def main():
    print("=" * 60)
    print("🚀 Optimizing HTML for SEO, Page Speed, and Font Loading...")
    print("=" * 60)

    # Note: This assumes a standard Vite React setup where index.html is in the client root.
    # If using Create React App, this path would be "client/public/index.html"
    index_path = "client/index.html"
    
    if not os.path.exists("client/index.html") and os.path.exists("client/public/index.html"):
        index_path = "client/public/index.html"

    # ==========================================
    # UPDATE INDEX.HTML (SEO Meta Tags + Font Optimization)
    # ==========================================
    create_file(index_path, """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- 🚀 SEO Meta Tags -->
    <title>Sakshi Lad Art | Acrylic Artist & Paintings</title>
    <meta name="description" content="Discover dreamy acrylic paintings inspired by sunsets, moonlit skies, oceans, and nature by Indian artist Sakshi Lad." />
    <meta name="keywords" content="acrylic artist, original paintings, landscape art, sunset paintings, ocean art, buy art online, Sakshi Lad" />

    <!-- ⚡ SEO Optimized Font Loading (Preconnect & Swap) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
""")

    print("\n✅ Success! Your fonts are now blazing fast and fully SEO compliant. The site also has proper meta tags for Google indexing.")

if __name__ == "__main__":
    main()