#!/usr/bin/env python3
import os
import re

def main():
    print("=" * 60)
    print("✨ Moving T&C Note to be inline with the description text...")
    print("=" * 60)

    # 1. Find the modal file
    target_file = None
    for root, dirs, files in os.walk("client/src"):
        for file in files:
            if file.endswith(".jsx"):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        if "DM to Buy" in f.read():
                            target_file = path
                            break
                except Exception:
                    pass
        if target_file:
            break

    if not target_file:
        print("  [-] Could not find the file containing the modal.")
        return

    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()

    # 2. Clean up any previous attempts (removes both <div> and <p> versions of the old note)
    content = re.sub(r'\{\/\*\s*T&C Note\s*\*\/\}.*?<\/div>', '', content, flags=re.DOTALL)
    content = re.sub(r'\{\/\*\s*T&C Note\s*\*\/\}.*?<\/p>\s*(?=<div|<button)', '', content, flags=re.DOTALL)

    # 3. Inject the clean, inline text note directly after the description paragraph
    # We find the "DM to Buy" buttons, find the closing </p> of the description right above it,
    # and insert a plain text <p> with no borders or fixed positioning.
    
    clean_inline_note = """
            {/* Inline T&C Note */}
            <p style={{ marginTop: '0.8rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#666', fontStyle: 'italic', lineHeight: '1.5' }}>
              * Please note: All artworks are original and hand-painted. Please read our <button type="button" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-terms')); }} style={{ background: 'none', border: 'none', color: '#D9886A', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontStyle: 'italic' }}>Terms and Conditions</button> before purchasing.
            </p>"""

    lines = content.split('\n')
    button_idx = -1
    paragraph_idx = -1

    for i, line in enumerate(lines):
        if "DM to Buy" in line:
            button_idx = i
            break
            
    if button_idx != -1:
        # Walk backwards to find the description's closing </p>
        for j in range(button_idx, -1, -1):
            if "</p>" in lines[j]:
                paragraph_idx = j
                break
                
    if paragraph_idx != -1:
        lines.insert(paragraph_idx + 1, clean_inline_note)
        content = '\n'.join(lines)
        
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [+] Successfully injected the inline T&C Note after the description in {os.path.basename(target_file)}")
    else:
        print("  [-] Could not find the description paragraph (</p>) to attach the note to.")

    print("\n✅ Success! The note will now flow naturally as part of the description text.")

if __name__ == "__main__":
    main()