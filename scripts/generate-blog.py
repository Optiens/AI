"""
Optiens ブログ記事アイキャッチ画像生成ヘルパー
Gemini Imagen 4.0（google-genai SDK）を使用

使い方:
  python scripts/generate-blog.py "プロンプト" "出力ファイルパス"
  python scripts/generate-blog.py "Hydroponic basil farm with IoT sensors" "public/blog/test.webp"
"""

import sys
import os

def generate_image(prompt: str, output_path: str) -> bool:
    from google import genai
    from PIL import Image
    import io

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # .envから読み込み
        env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.strip().split("=", 1)[1]
                        break

    if not api_key:
        print("ERROR: GEMINI_API_KEY not found", file=sys.stderr)
        return False

    client = genai.Client(api_key=api_key)

    full_prompt = (
        f"{prompt}. "
        "Style: modern, clean, professional photography or illustration. "
        "Color palette inspired by deep green (#2e574c) and teal (#5ea89a). "
        "No text, no watermarks, no logos. "
        "High quality, 16:9 aspect ratio."
    )

    try:
        response = client.models.generate_images(
            model="imagen-4.0-generate-001",
            prompt=full_prompt,
            config=genai.types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9",
                output_mime_type="image/png",
            ),
        )

        if response.generated_images:
            img_bytes = response.generated_images[0].image.image_bytes
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # .webpの場合はPNG→WebPに変換
            if output_path.endswith(".webp"):
                img = Image.open(io.BytesIO(img_bytes))
                img.save(output_path, "WEBP", quality=85)
            else:
                with open(output_path, "wb") as f:
                    f.write(img_bytes)

            print(f"OK: {output_path}")
            return True
        else:
            print("ERROR: No images generated", file=sys.stderr)
            return False

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate-blog.py <prompt> <output_path>")
        sys.exit(1)

    success = generate_image(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
