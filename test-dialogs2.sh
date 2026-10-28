#!/bin/bash
test_add_dialog() {
  local section="$1"
  agent-browser eval "(() => { const btns = Array.from(document.querySelectorAll('nav button, nav a')); const b = btns.find(x => x.textContent.trim().startsWith('$section')); if (b) { b.click(); return 'ok'; } return 'fail'; })()" > /dev/null 2>&1
  sleep 2.5
  agent-browser eval "(() => { const main = document.querySelector('main'); if (!main) return 'no-main'; const btns = Array.from(main.querySelectorAll('button')); const add = btns.find(b => /إضافة|اضافة|جديد|new/i.test(b.textContent) || b.getAttribute('aria-label')?.match(/إضافة|جديد/)); if (add) { add.click(); return 'clicked'; } return 'no-add-btn'; })()" > /dev/null 2>&1
  sleep 1.5
  agent-browser eval "JSON.stringify({dialog: !!document.querySelector('[role=dialog]'), title: (document.querySelector('[role=dialog] h2, [role=dialog] [data-slot=dialog-title]')?.textContent || '').slice(0,40), visible: (() => { const d = document.querySelector('[role=dialog]'); if (!d) return false; const r = d.getBoundingClientRect(); return r.width > 100 && r.height > 100; })()})" 2>&1
  agent-browser eval "(() => { document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})); return 'esc'; })()" > /dev/null 2>&1
  sleep 1
}
echo "=== SESSIONS ==="; test_add_dialog "الجلسات"
echo "=== ATTENDANCE ==="; test_add_dialog "الحضور"
echo "=== ANNOUNCEMENTS ==="; test_add_dialog "الإعلانات"
echo "=== LIBRARY ==="; test_add_dialog "المكتبة"
echo "=== FEES ==="; test_add_dialog "الرسوم"
