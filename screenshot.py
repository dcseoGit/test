from playwright.sync_api import sync_playwright
from pathlib import Path

# 경로 설정
FRONTEND  = Path(__file__).parent / "frontend" / "index.html"
OUTPUT    = Path(__file__).parent / "docs"
OUTPUT.mkdir(exist_ok=True)

PAGES = [
    {"menu": None,        "file": "01_tasks.png",   "label": "업무 관리"},
    {"menu": "사다리게임", "file": "02_ladder.png",  "label": "사다리게임"},
    {"menu": "룰렛",      "file": "03_roulette.png", "label": "룰렛"},
]

def take_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        url = FRONTEND.as_uri()
        page.goto(url)
        page.wait_for_load_state("networkidle")

        for item in PAGES:
            # 메뉴 클릭으로 페이지 이동
            if item["menu"]:
                page.locator(f"text={item['menu']}").first.click()
                page.wait_for_timeout(600)

            out_path = OUTPUT / item["file"]
            page.screenshot(path=str(out_path), full_page=False)
            print(f"저장 완료: {out_path}  ({item['label']})")

        browser.close()
        print("\n모든 스크린샷 저장 완료 ->", OUTPUT)

if __name__ == "__main__":
    take_screenshots()
