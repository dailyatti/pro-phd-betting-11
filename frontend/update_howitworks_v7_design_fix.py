
import os

file_path = "d:\\minden adat a gépről\\Letöltések mappából\\phd betting\\frontend\\src\\pages\\HowItWorksPage.jsx"

# --- 1. NEW CSS BLOCK (Fixes Light Mode Button Background) ---
# We update the .theme-light block to use transparent/semi-transparent backgrounds for buttons.

new_css_definitions = r"""                /* LIGHT MODE (Academic Whitepaper) */
                .phd-lab-theme.theme-light {
                  --phd-bg: #f8fafc;
                  --phd-text: #0f172a;
                  --phd-muted: #475569;
                  --phd-card-bg: linear-gradient(180deg, #ffffff, #f8fafc); /* Subtler gradient */
                  --phd-card-border: #cbd5e1;
                  --phd-line: #e2e8f0;
                  --phd-accent: #0284c7; /* Adjusted Blue */
                  --phd-code-bg: #ffffff;
                  --phd-btn-bg: rgba(255, 255, 255, 0.5); /* Semi-transparent blending */
                  --phd-btn-border: rgba(0, 0, 0, 0.08); /* Minimal border */
                  --phd-btn-text: #64748b;
                  
                  background: radial-gradient(1200px 600px at 20% -10%, rgba(14, 165, 233, 0.05), transparent 60%),
                              radial-gradient(900px 500px at 90% 0%, rgba(99, 102, 241, 0.05), transparent 55%),
                              var(--phd-bg);
                }"""

# --- 2. REPLACE LOGIC ---
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the specific block for .theme-light in the CSS string.
# It starts with "/* LIGHT MODE (Academic Whitepaper) */"
# And ends before the next closing brace logic of the style tag, or specifically before ".phd-lab-theme h1".

start_marker = "/* LIGHT MODE (Academic Whitepaper) */"
start_idx = content.find(start_marker)

end_marker = ".phd-lab-theme h1 {"
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # We replace from start_marker to just before end_marker, but we need to be careful about the closing brace of the previous block strictly? 
    # Actually the replaced block includes the class definition.
    # The original code has the class definition right after the comment.
    
    # Let's inspect what we are replacing.
    # Content snippet:
    # /* LIGHT MODE ... */
    # .phd-lab-theme.theme-light { ... }
    # 
    # .phd-lab-theme h1 { ... }
    
    # My new_css_definitions includes the comment and the class block.
    # So I can just replace the range.
    
    # We need to find the exact end of the .theme-light block.
    # It ends with a closing brace '}' before the next selector.
    # But strictly speaking, if I replace up to `end_idx` (start of h1), it should cover the whitespace too.
    
    # Let's verify end_idx is after start_idx
    if end_idx > start_idx:
        # Check if there is padding/newlines to clean up?
        # The new string ends with }.
        # The replacement range is [start_idx : end_idx].
        
        # NOTE: The new string ends with `}` but `new_css_definitions` in python variable above ends with `}`.
        # The original code between `start_marker` and `end_marker` is:
        # /* LIGHT MODE ... */
        # .phd-lab-theme.theme-light {
        # ...
        # }
        #
        
        # So replacing [start_idx : end_idx] with new_css_definitions + "\n\n" is safe.
        
        content = content[:start_idx] + new_css_definitions + "\n\n                " + content[end_idx:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successful V7 Update: Fixed Light Mode Buttons & Transparency.")
    else:
        print("Error: End marker found before start marker.")
else:
    print("Error: Could not find CSS markers.")
