import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import os

# Japanese font setup
plt.rcParams['font.family'] = 'MS Gothic'
plt.rcParams['font.size'] = 11

# Brand colors
PRIMARY = '#2e574c'
SECONDARY = '#5ea89a'
ACCENT = '#ea4335'
LIGHT_BG = '#f0f7f5'
WHITE = '#ffffff'
GRAY = '#666666'
LIGHT_GRAY = '#e8e8e8'

out_dir = r'c:\workspace\optiens-website\executive\finance\report\images'
os.makedirs(out_dir, exist_ok=True)

# ============================================================
# 1. Business Structure (1-1)
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(10, 5))
ax.set_xlim(0, 10); ax.set_ylim(0, 5); ax.axis('off')
fig.patch.set_facecolor(WHITE)

ax.text(5, 4.7, '\u4e8b\u696d\u69cb\u9020\uff08\u73fe\u5728 \u2192 \u76ee\u6307\u3059\u59ff\uff09', ha='center', va='top', fontsize=16, fontweight='bold', color=PRIMARY)

# Current
box1 = FancyBboxPatch((0.3, 1.5), 3.8, 2.5, boxstyle="round,pad=0.15", facecolor=LIGHT_GRAY, edgecolor=GRAY, linewidth=1.5)
ax.add_patch(box1)
ax.text(2.2, 3.7, '\u3010\u73fe\u5728\u3011', ha='center', fontsize=13, fontweight='bold', color=GRAY)
ax.text(2.2, 3.1, 'Salesforce\u4fdd\u5b88\u958b\u767a', ha='center', fontsize=12, color=GRAY)
ax.text(2.2, 2.6, '\u6708\u984d 605,000\u5186', ha='center', fontsize=14, fontweight='bold', color=GRAY)
ax.text(2.2, 2.1, '\u58f2\u4e0a\u30b7\u30a7\u30a2 100%\uff081\u793e\u4f9d\u5b58\uff09', ha='center', fontsize=10, color=ACCENT)
ax.text(2.2, 0.8, '\u26a0 \u5951\u7d04\u7d42\u4e86\u3067\u53ce\u5165\u30bc\u30ed', ha='center', fontsize=11, color=ACCENT, fontweight='bold')

# Arrow
ax.annotate('', xy=(5.7, 2.75), xytext=(4.3, 2.75), arrowprops=dict(arrowstyle='->', color=PRIMARY, lw=3))

# Future
box2 = FancyBboxPatch((5.9, 0.3), 3.8, 4.2, boxstyle="round,pad=0.15", facecolor=LIGHT_BG, edgecolor=PRIMARY, linewidth=2)
ax.add_patch(box2)
ax.text(7.8, 4.2, '\u3010\u76ee\u6307\u3059\u59ff\u3011', ha='center', fontsize=13, fontweight='bold', color=PRIMARY)

box_sf = FancyBboxPatch((6.2, 2.8), 3.2, 1.1, boxstyle="round,pad=0.1", facecolor=WHITE, edgecolor=SECONDARY, linewidth=1.5)
ax.add_patch(box_sf)
ax.text(7.8, 3.5, '\u67f1\u2460 SF\u4fdd\u5b88\u958b\u767a', ha='center', fontsize=11, fontweight='bold', color=PRIMARY)
ax.text(7.8, 3.05, '\u5b89\u5b9a\u53ce\u5165\u3067\u751f\u6d3b\u57fa\u76e4\u3092\u78ba\u4fdd', ha='center', fontsize=9, color=GRAY)

box_herb = FancyBboxPatch((6.2, 0.6), 3.2, 1.8, boxstyle="round,pad=0.1", facecolor=SECONDARY, edgecolor=PRIMARY, linewidth=2)
ax.add_patch(box_herb)
ax.text(7.8, 2.05, '\u67f1\u2461 \u6c34\u8015\u683d\u57f9\u30cf\u30fc\u30d6', ha='center', fontsize=11, fontweight='bold', color=WHITE)
ax.text(7.8, 1.55, 'IoT\u00d7AI \u3067\u901a\u5e74\u5b89\u5b9a\u751f\u7523', ha='center', fontsize=9, color=WHITE)
ax.text(7.8, 1.1, '\u30ec\u30b9\u30c8\u30e9\u30f3\u30fb\u9053\u306e\u99c5\u30fb\u696d\u52d9\u7528EC', ha='center', fontsize=9, color=WHITE)
ax.text(7.8, 0.75, '\u2605\u672c\u88dc\u52a9\u4e8b\u696d\u3067\u8ca9\u8def\u958b\u62d3', ha='center', fontsize=10, fontweight='bold', color='#ffdd44')

plt.tight_layout()
plt.savefig(os.path.join(out_dir, '01_business_structure.png'), dpi=150, bbox_inches='tight', facecolor=WHITE)
plt.close()
print('1. OK')

# ============================================================
# 2. Revenue Composition (1-2)
# ============================================================
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
fig.patch.set_facecolor(WHITE)
fig.suptitle('\u58f2\u4e0a\u69cb\u6210\u306e\u73fe\u72b6\u3068\u76ee\u6a19', fontsize=16, fontweight='bold', color=PRIMARY, y=1.02)

axes[0].pie([100], labels=['SF\u4fdd\u5b88\u958b\u767a\n7,260,000\u5186\n(1\u793e\u4f9d\u5b58)'], colors=[LIGHT_GRAY],
    textprops={'fontsize': 11, 'color': GRAY}, startangle=90,
    wedgeprops={'edgecolor': ACCENT, 'linewidth': 2})
axes[0].set_title('\u73fe\u5728\uff082025\u5e74\u5ea6\uff09', fontsize=13, fontweight='bold', color=GRAY, pad=10)

axes[1].pie([75, 25], labels=['SF\u4fdd\u5b88\u958b\u767a\n\uff08\u5b89\u5b9a\u57fa\u76e4\uff09', '\u6c34\u8015\u683d\u57f9\u30cf\u30fc\u30d6\n\uff08\u6210\u9577\u4e8b\u696d\uff09'],
    colors=[LIGHT_BG, SECONDARY], explode=(0, 0.08),
    textprops={'fontsize': 10, 'color': PRIMARY}, startangle=90,
    wedgeprops={'edgecolor': PRIMARY, 'linewidth': 1.5},
    autopct='%1.0f%%', pctdistance=0.6)
axes[1].set_title('\u76ee\u6a19\uff08Phase 2\u301c\uff09', fontsize=13, fontweight='bold', color=PRIMARY, pad=10)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, '02_revenue_composition.png'), dpi=150, bbox_inches='tight', facecolor=WHITE)
plt.close()
print('2. OK')

# ============================================================
# 3. Issues -> Solutions (1-3)
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(10, 5.5))
ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis('off')
fig.patch.set_facecolor(WHITE)

ax.text(5, 5.8, '\u7d4c\u55b6\u8ab2\u984c\u3068\u89e3\u6c7a\u7b56', ha='center', va='top', fontsize=16, fontweight='bold', color=PRIMARY)

issues = [
    ('\u8ab2\u984c1', '\u4e00\u793e\u4f9d\u5b58\u30ea\u30b9\u30af', ACCENT),
    ('\u8ab2\u984c2', '\u58f2\u4e0a\u6210\u9577\u306e\u5929\u4e95', ACCENT),
    ('\u8ab2\u984c3', '\u4e8b\u696d\u591a\u89d2\u5316\u306e\u5fc5\u8981\u6027', ACCENT),
    ('\u8ab2\u984c4', '\u8fb2\u696d\u672a\u7d4c\u9a13', '#e88833'),
    ('\u8ab2\u984c5', '\u8ca9\u8def\u30bc\u30ed', ACCENT),
    ('\u8ab2\u984c6', '\u8a8d\u77e5\u5ea6\u30bc\u30ed', ACCENT),
]
solutions = [
    '\u65b0\u898f\u4e8b\u696d\u306e\u7acb\u3061\u4e0a\u3052',
    '\u65b0\u898f\u4e8b\u696d\u306e\u7acb\u3061\u4e0a\u3052',
    '\u65b0\u898f\u4e8b\u696d\u306e\u7acb\u3061\u4e0a\u3052',
    'IoT\u30c7\u30fc\u30bf\u3067\u88dc\u5b8c\uff08\u81ea\u52a9\u52aa\u529b\uff09',
    '\u2605\u672c\u88dc\u52a9\u4e8b\u696d\u3067\u89e3\u6c7a',
    '\u2605\u672c\u88dc\u52a9\u4e8b\u696d\u3067\u89e3\u6c7a',
]

for i, ((num, text, color), sol) in enumerate(zip(issues, solutions)):
    y = 4.8 - i * 0.8
    box = FancyBboxPatch((0.2, y-0.25), 3.5, 0.5, boxstyle="round,pad=0.08",
                          facecolor='#fff0f0' if color == ACCENT else '#fff8f0', edgecolor=color, linewidth=1.5)
    ax.add_patch(box)
    ax.text(0.5, y, num, ha='left', fontsize=10, fontweight='bold', color=color)
    ax.text(1.5, y, text, ha='left', fontsize=10, color='#333333')
    ax.annotate('', xy=(5.8, y), xytext=(3.9, y), arrowprops=dict(arrowstyle='->', color=GRAY, lw=1.2))

    is_subsidy = '\u2605' in sol
    is_iot = 'IoT' in sol
    sol_bg = SECONDARY if is_subsidy else ('#fff8f0' if is_iot else LIGHT_GRAY)
    sol_ec = PRIMARY if is_subsidy else ('#e88833' if is_iot else GRAY)
    sol_tc = WHITE if is_subsidy else ('#e88833' if is_iot else GRAY)
    box_s = FancyBboxPatch((5.9, y-0.25), 3.8, 0.5, boxstyle="round,pad=0.08", facecolor=sol_bg, edgecolor=sol_ec, linewidth=1.5)
    ax.add_patch(box_s)
    ax.text(7.8, y, sol, ha='center', fontsize=10, fontweight='bold', color=sol_tc)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, '03_issues_solutions.png'), dpi=150, bbox_inches='tight', facecolor=WHITE)
plt.close()
print('3. OK')

# ============================================================
# 4. Market Trend (2-1)
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(10, 4))
fig.patch.set_facecolor(WHITE)

years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]
market = [165, 189, 217, 249, 286, 328, 376, 420]

ax.fill_between(years, market, alpha=0.15, color=SECONDARY)
ax.plot(years, market, 'o-', color=PRIMARY, linewidth=2.5, markersize=8)

for i, (x, y) in enumerate(zip(years, market)):
    if i in [0, 3, 7]:
        ax.annotate(f'{y}\u5104$', (x, y), textcoords="offset points", xytext=(0, 15), ha='center', fontsize=10, fontweight='bold', color=PRIMARY)

ax.axvline(x=2026, color=ACCENT, linestyle='--', linewidth=1.5, alpha=0.7)
ax.text(2026.1, 380, 'Optiens\n\u53c2\u5165', fontsize=10, color=ACCENT, fontweight='bold')

ax.set_title('\u4e16\u754c\u306e\u6c34\u8015\u683d\u57f9\u5e02\u5834\u898f\u6a21\uff08Grand View Research\u8abf\u3079\uff09', fontsize=14, fontweight='bold', color=PRIMARY, pad=15)
ax.set_ylabel('\u5e02\u5834\u898f\u6a21\uff08\u5104\u30c9\u30eb\uff09', fontsize=11, color=GRAY)
ax.set_xlim(2022.5, 2030.5)
ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRAY); ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=GRAY); ax.set_facecolor(WHITE)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, '04_market_trend.png'), dpi=150, bbox_inches='tight', facecolor=WHITE)
plt.close()
print('4. OK')

# ============================================================
# 5. SWOT Matrix (3)
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(10, 5.5))
ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis('off')
fig.patch.set_facecolor(WHITE)

# Strengths
s_box = FancyBboxPatch((0.1, 0.2), 4.8, 5.5, boxstyle="round,pad=0.15", facecolor=LIGHT_BG, edgecolor=PRIMARY, linewidth=2)
ax.add_patch(s_box)
ax.text(2.5, 5.4, '\u5f37\u307f', ha='center', fontsize=16, fontweight='bold', color=PRIMARY)

strengths = [
    '\u2460 IT\u6280\u8853\u529b\uff08SF 9\u5e74\u30fbIoT\u81ea\u793e\u958b\u767a\uff09',
    '\u2461 \u30c7\u30fc\u30bf\u99c6\u52d5\u7d4c\u55b6\uff081\u682a\u30b3\u30b9\u30c8\u7ba1\u7406\uff09',
    '\u2462 \u4f4e\u56fa\u5b9a\u8cbb\uff08SF\u53ce\u5165\u3067\u751f\u6d3b\u57fa\u76e4\u78ba\u4fdd\uff09',
    '\u2463 \u6e05\u91cc\u9ad8\u539f\u306e\u7acb\u5730\uff08\u98f2\u98df\u5e97\u96c6\u7a4d\uff09',
    '\u2464 AI\u5185\u88fd\u5316\uff08\u5916\u6ce8\u8cbb\u30bc\u30ed\uff09',
    '\u2465 \u62e1\u5927\u53ef\u80fd\u306a\u62e0\u70b9\uff08\u5225\u8358\u306b\u7a7a\u304d\u5ba4\uff09',
]
for i, s in enumerate(strengths):
    ax.text(0.4, 4.7 - i * 0.7, s, ha='left', fontsize=10, color=PRIMARY)

# Weaknesses
w_box = FancyBboxPatch((5.1, 0.2), 4.8, 5.5, boxstyle="round,pad=0.15", facecolor='#fff5f5', edgecolor=ACCENT, linewidth=2)
ax.add_patch(w_box)
ax.text(7.5, 5.4, '\u5f31\u307f', ha='center', fontsize=16, fontweight='bold', color=ACCENT)

weaknesses = [
    ('\u2460 \u8fb2\u696d\u5b9f\u52d9\u7d4c\u9a13\u306a\u3057', '\u2192 IoT\u30c7\u30fc\u30bf\u3067\u88dc\u5b8c'),
    ('\u2461 \u8ca9\u8def\u30bc\u30ed', '\u2192 \u2605\u672c\u88dc\u52a9\u4e8b\u696d\u3067\u958b\u62d3'),
    ('\u2462 \u4e00\u793e\u4f9d\u5b58\u30ea\u30b9\u30af', '\u2192 \u53ce\u5165\u6e90\u306e\u591a\u89d2\u5316'),
    ('\u2463 \u8a8d\u77e5\u5ea6\u30bc\u30ed', '\u2192 \u2605\u672c\u88dc\u52a9\u4e8b\u696d\u3067\u7372\u5f97'),
]
for i, (w, s) in enumerate(weaknesses):
    y = 4.7 - i * 1.0
    ax.text(5.4, y, w, ha='left', fontsize=10, color=ACCENT)
    sol_color = PRIMARY if '\u2605' in s else GRAY
    ax.text(5.4, y - 0.35, s, ha='left', fontsize=10, fontweight='bold', color=sol_color)

plt.tight_layout()
plt.savefig(os.path.join(out_dir, '05_swot.png'), dpi=150, bbox_inches='tight', facecolor=WHITE)
plt.close()
print('5. OK')

# ============================================================
# 6. Roadmap (4-2)
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(10, 5))
ax.set_xlim(0, 10); ax.set_ylim(0, 5.5); ax.axis('off')
fig.patch.set_facecolor(WHITE)

ax.text(5, 5.3, '\u30ed\u30fc\u30c9\u30de\u30c3\u30d7', ha='center', va='top', fontsize=16, fontweight='bold', color=PRIMARY)

# Timeline
ax.annotate('', xy=(9.5, 3.0), xytext=(0.5, 3.0), arrowprops=dict(arrowstyle='->', color=GRAY, lw=2))

phases = [
    {'x': 0.5, 'w': 2.8, 'label': 'Phase 1', 'period': '2026/4-9',
     'color': SECONDARY, 'items': ['\u81ea\u5b85\u30c6\u30b9\u30c8\u683d\u57f9', 'IoT\u30b7\u30b9\u30c6\u30e0\u7a3c\u50cd', '\u30b3\u30b9\u30c8\u5b9f\u8a3c', '\u2605\u8ca9\u8def\u6e96\u5099\uff08\u88dc\u52a9\u4e8b\u696d\uff09']},
    {'x': 3.5, 'w': 2.8, 'label': 'Phase 2', 'period': '2026/10-2027/3',
     'color': PRIMARY, 'items': ['\u5225\u8358\u3067\u672c\u683c\u751f\u7523', '\u30e9\u30c3\u30af8-10\u53f0', '\u30ec\u30b9\u30c8\u30e9\u30f3\u76f4\u8ca9\u958b\u59cb', '\u6708\u58f2\u4e0a6-10\u4e07\u5186']},
    {'x': 6.5, 'w': 2.8, 'label': 'Phase 3', 'period': '2027/4-',
     'color': '#1a3d33', 'items': ['3\u5ba424-26\u53f0', '\u54c1\u76ee\u62e1\u5145', '\u6708\u58f2\u4e0a16-25\u4e07\u5186', 'EC\u58f2\u4e0a\u6bd4\u7387\u62e1\u5927']},
]

for p in phases:
    box = FancyBboxPatch((p['x'], 0.3), p['w'], 2.4, boxstyle="round,pad=0.1",
                          facecolor=p['color'], edgecolor=p['color'], linewidth=2, alpha=0.9)
    ax.add_patch(box)
    ax.text(p['x'] + p['w']/2, 2.45, p['label'], ha='center', fontsize=14, fontweight='bold', color=WHITE)
    ax.text(p['x'] + p['w']/2, 2.05, p['period'], ha='center', fontsize=9, color='#ccddcc')
    for i, item in enumerate(p['items']):
        color = '#ffdd44' if '\u2605' in item else WHITE
        weight = 'bold' if '\u2605' in item else 'normal'
        ax.text(p['x'] + 0.2, 1.5 - i * 0.35, item, ha='left', fontsize=9, color=color, fontweight=weight)
    ax.plot(p['x'] + p['w']/2, 3.0, 'o', color=p['color'], markersize=12, zorder=5)
    ax.plot(p['x'] + p['w']/2, 3.0, 'o', color=WHITE, markersize=6, zorder=6)

ax.text(3.35, 3.6, '4\u6761\u4ef6\u30af\u30ea\u30a2\u3067\u79fb\u884c', ha='center', fontsize=9,
        color=ACCENT, fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='#fff0f0', edgecolor=ACCENT, linewidth=1))

ax.text(1.9, 4.5, '\u2605\u672c\u88dc\u52a9\u4e8b\u696d', ha='center', fontsize=12,
        fontweight='bold', color=PRIMARY,
        bbox=dict(boxstyle='round,pad=0.4', facecolor='#e8f5e9', edgecolor=SECONDARY, linewidth=2))
ax.annotate('', xy=(1.9, 2.8), xytext=(1.9, 4.1), arrowprops=dict(arrowstyle='->', color=SECONDARY, lw=1.5))

plt.tight_layout()
plt.savefig(os.path.join(out_dir, '06_roadmap.png'), dpi=150, bbox_inches='tight', facecolor=WHITE)
plt.close()
print('6. OK')

print('\n=== All images generated ===')
for f in sorted(os.listdir(out_dir)):
    size = os.path.getsize(os.path.join(out_dir, f))
    print(f'  {f} ({size//1024}KB)')
