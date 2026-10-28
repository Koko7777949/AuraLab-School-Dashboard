#!/bin/bash
# Systematic section testing
SECTIONS=("الطلاب" "المعلمون" "الصفوف" "الامتحانات" "الجلسات" "الحضور" "الدرجات" "سلوك الطلاب" "الجدول الدراسي" "التحليلات" "التقارير" "الإعلانات" "الرسائل" "الإشعارات" "المساعد الذكي" "المحذوفات" "المكتبة" "الرسوم" "كاميرات الفصول" "الإعدادات")
i=2
for s in "${SECTIONS[@]}"; do
  agent-browser eval "(() => { const btns = Array.from(document.querySelectorAll('nav button, nav a')); const b = btns.find(x => x.textContent.trim().startsWith('$s')); if (b) { b.click(); return 'clicked: $s'; } return 'NOT FOUND: $s'; })()" > /dev/null 2>&1
  sleep 3
  RESULT=$(agent-browser eval "JSON.stringify({err: !!document.querySelector('[data-error-boundary]'), blank: (document.querySelector('main')?.innerText || '').trim().length < 10, h: (document.querySelector('main')?.querySelector('h1,h2,h3')?.textContent || '').slice(0,40)})" 2>&1)
  agent-browser screenshot /home/z/my-project/tool-results/check-$(printf "%02d" $i)-${s// /_}.png > /dev/null 2>&1
  echo "$s => $RESULT"
  i=$((i+1))
done
