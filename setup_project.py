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
    print("✨ Adding new paintings to GalleryData.js...")
    print("=" * 60)

    # ==========================================
    # UPDATE GALLERYDATA.JS
    # ==========================================
    create_file("client/src/GalleryData.js", """
import Moon from "./assets/Images/Moon.jpeg";
import Tides from "./assets/Images/Tides.jpeg";
import Stillness from "./assets/Images/94134.jpg";
import Ocean from "./assets/Images/Ocean.jpeg";
import Echoes_of_Ocean from "./assets/Images/Echoes_of_Ocean.jpeg";
import Loves_Waves from "./assets/Images/94264.jpg";
import Latic_Afterglow from "./assets/Images/Latic_Afterglow.jpeg";

export const paintings = [
  {
    id: 1,
    img: Tides,
    title: "Tides of a daydream",
    price: "₹900",
    size: "4 × 4 in (10.2 × 10.2 cm)",
    availability: "Available",
    story:
      "Tides of a daydream captures a dreamy pink and violet sunset drifting across a tranquil ocean, with soft clouds, glowing light, and gentle waves creating a peaceful little escape. A tiny original artwork made to bring a touch of dreamy serenity to your space. Includes the white frame shown. Signed on the back. 💜🌊\\n\\n• Original acrylic painting on canvas\\n• Framed: Includes the white frame shown\\n• Sealed with a protective varnish\\n• Carefully packaged for shipping",
  },
  {
    id: 2,
    img: Moon,
    title: "Moon's magic",
    price: "₹1,530",
    size: "6 in diameter (15.2 cm)",
    availability: "Available",
    story:
      "Moon's magic captures the intricate detail and timeless wonder of the lunar surface, blending stark monochromatic textures with bright, radiant ray craters. A detailed original artwork crafted to bring a touch of celestial wonder and quiet enchantment to your space. Signed on the back. 🌙✨\\n\\n• Original acrylic painting on round stretched canvas\\n• Sealed with a protective varnish\\n• Carefully packaged for shipping",
  },
  {
    id: 3,
    img: Stillness,
    title: "Stillness beyond the pines",
    price: "₹3,400",
    size: "10-inch oval canvas board",
    availability: "Available",
    story:
      "A dreamy hand-painted scene inspired by the gentle beauty of nature. A delicate feather drifts across a soft pastel sky, floating above a peaceful forest of pine trees. The blend of pink, blue, and lavender creates a calm, dreamy atmosphere, capturing the feeling of freedom and going wherever the wind takes you.\\n\\n• Original hand-painted artwork\\n• Medium: Acrylic on canvas\\n• Finish: Gloss varnished for added protection",
  },
  {
    id: 4,
    img: Ocean,
    title: "Ocean serenity",
    price: "₹3,200",
    size: "8 inches (Circle)",
    availability: "Available",
    story:
      "A handmade ocean-inspired painting capturing the movement and depth of waves in shades of deep blue, turquoise and white. The textured brushwork gives the waves a dynamic, flowing feel.\\n\\n• Medium: Acrylic on canvas\\n• Theme: Ocean / Seascape\\n• Textured brushwork and layered details\\n• Carefully packed for shipping",
  },
  {
    id: 5,
    img: Echoes_of_Ocean,
    title: "Echoes of the endless ocean",
    price: "₹8,400",
    size: "32 cm × 22.5 cm (12.5 in × 8.8 in)",
    availability: "Available",
    story:
      "Bring the serene, hypnotic rhythm of the deep sea into your home with Echoes of the Endless Ocean. Painted with rich, layered acrylics, this piece captures the continuous movement of calm ocean waves under a vibrant blue sky—a perfect statement artwork to bring tranquil energy to any desk, shelf, or wall space.\\n\\n• Medium: Acrylic on canvas (framed)\\n• Style: Contemporary Seascapes / Realism\\n• Includes: 1 x Original hand-painted canvas in a dark wooden frame with gold trim.",
  },
  {
    id: 6,
    img: Loves_Waves,
    title: "Love beyond the waves",
    price: "₹2,300",
    size: "15.2 cm × 15.2 cm (6 in × 6 in)",
    availability: "Available",
    story:
      "Bring a touch of charm and color into your home with this hand-painted heart piece. Painted with rich, layered acrylics, this artwork captures vibrant textures and peaceful energy—a perfect statement accent to elevate any desk, shelf, or wall space.\\n\\n• Medium: Acrylic on canvas board\\n• Style: Contemporary Fine Art\\n• Finish: Gloss varnished for protection",
  },
  {
    id: 7,
    img: Latic_Afterglow,
    title: "Lilac afterglow",
    price: "₹2,799",
    size: "8 in diameter (20.3 cm)",
    availability: "Available",
    story:
      "Lilac afterglow captures a dreamy sunset painted in rich shades of lilac, deep purple, and fiery orange gradient lights above rolling ocean waves. Soft clouds and gentle, foamy surf meet vibrant horizon tones to bring a serene and magical escape directly into your space. Signed on the back. 💜🌅\\n\\n• Original acrylic painting on round canvas\\n• Sealed with a protective varnish\\n• Carefully packaged for shipping",
  },
  {
    id: 8,
    img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80", // Replace with your image import when ready
    title: "Moonlit clouds",
    price: "₹1,890",
    size: "6 in diameter (15.2 cm)",
    availability: "Available",
    story:
      "Moonlit clouds brings to life a glowing crescent moon nestled over deep blue, velvety clouds scattered with twinkling stars. Filled with soft textures and night sky magic, this piece adds a calming touch of wonder to any cozy corner. Signed on the back. 🌙☁️✨\\n\\n• Original acrylic painting on round canvas\\n• Sealed with a protective varnish\\n• Carefully packaged for shipping",
  },
  {
    id: 9,
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80", // Replace with your image import when ready
    title: "Twilight in a heartbeat",
    price: "₹4,789",
    size: "8 in (20.3 cm)",
    availability: "Available",
    story:
      "Twilight in a heartbeat paints a breathtaking dusk horizon across a heart-shaped view, where vivid fiery orange and deep magenta fade into soft twilight purples and starry blue skies. A delicate crescent moon glows over smooth, reflective ocean waves to bring a romantic touch of evening tranquility into your home. Signed on the back. 💖🌙🌊\\n\\n• Original acrylic painting on heart-shaped stretched canvas\\n• Sealed with a protective varnish\\n• Carefully packaged for shipping",
  },
  {
    id: 10,
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", // Replace with your image import when ready
    title: "Dreaming tides",
    price: "₹1,169",
    size: "6 × 6 in (15.2 × 15.2 cm)",
    availability: "Available",
    story:
      "Dreaming tides showcases a full golden moon suspended over tranquil blue ocean waters, casting a soft shimmering reflection along gentle waves. Smooth color gradients and delicate foamy shorelines come together to create a soothing, peaceful escape for your space. Signed on the back. 🌕🌊✨\\n\\n• Original acrylic painting on canvas\\n• Sealed with a protective varnish\\n• Carefully packaged for shipping",
  },
  {
    id: 11,
    img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", // Replace with your image import when ready
    title: "Moonlit dancing across violet waves",
    price: "₹1,150",
    size: "6 × 6 in (15.2 × 15.2 cm)",
    availability: "Available",
    story:
      "Moonlit dancing across violet waves presents a full, luminescent moon casting a brilliant path of light across sculpted violet ocean waves. Velvety purple gradients and sparkling reflections create a serene, enchanting nightscape designed to bring a touch of magical calm to your space. Signed on the back. 💜🌕🌊\\n\\n• Original acrylic painting on canvas\\n• Sealed with a protective varnish\\n• Carefully packaged for shipping",
  }
];
""")

    print("\n✅ Success! GalleryData.js has been successfully updated with all 11 paintings.")

if __name__ == "__main__":
    main()