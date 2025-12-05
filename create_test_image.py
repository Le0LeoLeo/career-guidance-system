#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont

# 创建白色背景图片
img = Image.new('RGB', (800, 600), 'white')
draw = ImageDraw.Draw(img)

# 绘制表格边框
draw.rectangle([50, 50, 750, 550], outline='black', width=2)

# 绘制表头
draw.text((100, 100), 'Exam Schedule', fill='black')
draw.text((100, 150), 'Subject', fill='black')
draw.text((300, 150), 'Date', fill='black')
draw.text((500, 150), 'Time', fill='black')

# 绘制考试信息
draw.text((100, 200), 'Math', fill='black')
draw.text((300, 200), '2024-12-20', fill='black')
draw.text((500, 200), '09:00', fill='black')

draw.text((100, 250), 'English', fill='black')
draw.text((300, 250), '2024-12-21', fill='black')
draw.text((500, 250), '14:00', fill='black')

draw.text((100, 300), 'Chemistry', fill='black')
draw.text((300, 300), '2024-12-22', fill='black')
draw.text((500, 300), '10:00', fill='black')

# 保存图片
img.save('test_schedule.png')
print('Test image created: test_schedule.png')

