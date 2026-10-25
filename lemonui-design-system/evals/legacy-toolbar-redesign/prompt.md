---
tags: [lemonui]
max_turns: 60
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Redesign our legacy Persian ERP "work orders" screen using the Lemon UI design system. Today it is a DevExpress grid with a toolbar of 14 always-visible buttons: جدید, ویرایش, حذف, به روز آوری, ابطال, تائید, عدم تائید, عدم پیگیری, پیگیری مجدد, کپی درخواست, برگشت, چاپ, اختتام, چاپ مشتری. Above the grid there is a "drag a column here to group" strip. Columns: شماره دستور کار, شماره شاسی, تاریخ مراجعه, شماره کیلومتر, شرح کننده (always empty), گارانتی (read-only checkbox), وضعیت, پذیرش سایر سیستم ها (always empty), نمایندگی صادر کننده. Statuses in use: ثبت شده, تایید تعمیرگاه, ترخیص. Brand: dark navy #1C2B4B, light mode only. Use 5 clearly-labelled sample rows. Save as workorders.html and tell me what you changed and why.
