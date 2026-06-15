const state = {
  images: [],
  analysis: null,
  rowAnalyses: [],
  rowDescriptions: [],
};

const imageInput = document.querySelector("#imageInput");
const uploadZone = document.querySelector("#uploadZone");
const noteUrlInput = document.querySelector("#noteUrlInput");
const importNote = document.querySelector("#importNote");
const noteImportStatus = document.querySelector("#noteImportStatus");
const thumbGrid = document.querySelector("#thumbGrid");
const tileCount = document.querySelector("#tileCount");
const layoutMode = document.querySelector("#layoutMode");
const boardTitle = document.querySelector("#boardTitle");
const headerSubtitle = document.querySelector("#headerSubtitle");
const headerBgColor = document.querySelector("#headerBgColor");
const headerAccentColor = document.querySelector("#headerAccentColor");
const briefInput = document.querySelector("#briefInput");
const boardCanvas = document.querySelector("#boardCanvas");
const downloadBoard = document.querySelector("#downloadBoard");
const manualDownloadLink = document.querySelector("#manualDownloadLink");
const clearBoard = document.querySelector("#clearBoard");
const copyBrief = document.querySelector("#copyBrief");
const rowCopyEditor = document.querySelector("#rowCopyEditor");
const inspirationCopy = document.querySelector("#inspirationCopy");
const imageCount = document.querySelector("#imageCount");
const selectedCount = document.querySelector("#selectedCount");
const uploadMeter = document.querySelector("#uploadMeter");
const statusText = document.querySelector("#statusText");
const queueHint = document.querySelector("#queueHint");
const styleName = document.querySelector("#styleName");
const colorMood = document.querySelector("#colorMood");
const visualMood = document.querySelector("#visualMood");
const previewSize = document.querySelector("#previewSize");

const ctx = boardCanvas.getContext("2d");
let idSeed = 0;

const styleLabels = {
  auto: "自动识别",
  ui: "小红书界面设计风",
  collage: "Ins 多图拼贴风",
  polka: "波点元素装饰风",
};

const rowRoles = [
  "封面参考",
  "内容参考",
  "细节参考",
  "延展参考",
  "补充参考",
];

const aestheticAngles = [
  "重点看首图吸引力和主体露出。",
  "重点看图与图之间的节奏和留白。",
  "重点看材质、局部元素和装饰细节。",
  "重点看系列感、滤镜一致性和版式密度。",
  "重点看补充氛围，不抢主视觉。",
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

function shade(hex, amount) {
  const rgb = hexToRgb(hex);
  return rgbToHex({
    r: clamp(Math.round(rgb.r + amount), 0, 255),
    g: clamp(Math.round(rgb.g + amount), 0, 255),
    b: clamp(Math.round(rgb.b + amount), 0, 255),
  });
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id:
            globalThis.crypto?.randomUUID?.() ||
            `image-${Date.now()}-${(idSeed += 1).toString(36)}`,
          name: file.name,
          src: reader.result,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleFiles(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return;

  statusText.textContent = "正在读取图片";
  const loaded = await Promise.all(imageFiles.map(readFileAsImage));
  state.images = [...state.images, ...loaded];
  await updateBoard();
}

async function handleImportedAssets(assets) {
  const loaded = [];
  for (const asset of assets) {
    const response = await fetch(asset.url);
    if (!response.ok) continue;
    const blob = await response.blob();
    const file = new File([blob], asset.name || "note-image", {
      type: blob.type || asset.type || "image/jpeg",
    });
    loaded.push(await readFileAsImage(file));
  }
  state.images = [...state.images, ...loaded];
  await updateBoard();
  return loaded.length;
}

async function importNoteAssets() {
  const url = noteUrlInput.value.trim();
  if (!url) {
    noteUrlInput.focus();
    return;
  }

  importNote.disabled = true;
  importNote.textContent = "识别中";
  noteImportStatus.textContent = "抓取中";
  statusText.textContent = "正在识别小红书链接中的图片 / GIF";

  try {
    const response = await fetch("/api/import-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error || "链接识别失败");
    }
    const count = await handleImportedAssets(payload.assets || []);
    noteImportStatus.textContent = `导入 ${count} 张`;
    statusText.textContent = count
      ? `已从小红书链接导入 ${count} 张图片 / GIF`
      : "链接已识别，但没有可用图片";
  } catch (error) {
    noteImportStatus.textContent = "失败";
    statusText.textContent = error.message;
  } finally {
    importNote.disabled = false;
    importNote.textContent = "识别导入";
  }
}

function sampleImage(image) {
  const canvas = document.createElement("canvas");
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const sampleCtx = canvas.getContext("2d", { willReadFrequently: true });
  sampleCtx.drawImage(image.img, 0, 0, size, size);
  const { data } = sampleCtx.getImageData(0, 0, size, size);

  let brightness = 0;
  let saturation = 0;
  let contrast = 0;
  let warmth = 0;
  let edgeEnergy = 0;
  let whiteShare = 0;
  let darkShare = 0;
  let coloredShare = 0;
  const buckets = new Map();
  const gray = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const hsl = rgbToHsl(r, g, b);
    const light = (r + g + b) / 3;
    brightness += light;
    saturation += hsl.s;
    warmth += r - b;
    gray.push(light);

    if (light > 225 && hsl.s < 0.16) whiteShare += 1;
    if (light < 58) darkShare += 1;
    if (hsl.s > 0.42) coloredShare += 1;

    const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
    buckets.set(key, (buckets.get(key) || 0) + (0.35 + hsl.s) * (0.55 + Math.abs(hsl.l - 0.5)));
  }

  const total = data.length / 4;
  brightness /= total;
  saturation /= total;
  warmth /= total;
  whiteShare /= total;
  darkShare /= total;
  coloredShare /= total;

  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const index = y * size + x;
      edgeEnergy += Math.abs(gray[index] - gray[index - 1]) + Math.abs(gray[index] - gray[index - size]);
    }
  }
  edgeEnergy /= total;

  for (const value of gray) {
    contrast += Math.abs(value - brightness);
  }
  contrast /= total;

  const palette = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map((value) => clamp(Number(value), 0, 255));
      return rgbToHex({ r, g, b });
    });

  return {
    brightness,
    saturation,
    warmth,
    contrast,
    edgeEnergy,
    whiteShare,
    darkShare,
    coloredShare,
    palette,
  };
}

function groupRows(images = state.images) {
  const slots = Number(tileCount.value);
  const rows = [];
  for (let index = 0; index < images.length; index += slots) {
    rows.push(images.slice(index, index + slots));
  }
  return rows;
}

function choosePalette(samples) {
  const palette = samples.flatMap((sample) => sample.palette).slice(0, 40);
  const chosenPalette = [];
  palette.forEach((hex) => {
    const rgb = hexToRgb(hex);
    const distant = chosenPalette.every((item) => {
      const other = hexToRgb(item);
      return Math.abs(rgb.r - other.r) + Math.abs(rgb.g - other.g) + Math.abs(rgb.b - other.b) > 82;
    });
    if (distant && chosenPalette.length < 5) chosenPalette.push(hex);
  });

  while (chosenPalette.length < 5) {
    const base = chosenPalette[0] || "#111827";
    chosenPalette.push(shade(base, chosenPalette.length % 2 ? 46 : -40));
  }

  return chosenPalette;
}

function averageSamples(samples) {
  const avg = samples.reduce(
    (acc, sample) => {
      Object.keys(acc).forEach((key) => {
        acc[key] += sample[key];
      });
      return acc;
    },
    {
      brightness: 0,
      saturation: 0,
      warmth: 0,
      contrast: 0,
      edgeEnergy: 0,
      whiteShare: 0,
      darkShare: 0,
      coloredShare: 0,
    }
  );

  Object.keys(avg).forEach((key) => {
    avg[key] /= samples.length || 1;
  });
  return avg;
}

function detectStyle(avg, images, forceStyle = layoutMode.value) {
  if (forceStyle !== "auto") return styleLabels[forceStyle];

  const aspectSpread =
    images.length > 1
      ? Math.max(...images.map((image) => image.width / image.height)) -
        Math.min(...images.map((image) => image.width / image.height))
      : 0;
  const uiScore =
    avg.whiteShare * 1.3 + (avg.edgeEnergy > 22 ? 0.42 : 0) + (avg.saturation < 0.24 ? 0.34 : 0);
  const polkaScore =
    avg.coloredShare * 0.9 +
    (avg.whiteShare > 0.18 ? 0.28 : 0) +
    (avg.contrast > 42 && avg.contrast < 72 ? 0.2 : 0);

  if (polkaScore > 0.66 && avg.saturation > 0.24) return "波点元素装饰风";
  if (uiScore > 0.82) return "小红书界面设计风";
  if (images.length >= 3 || aspectSpread > 0.45) return "Ins 多图拼贴风";
  if (avg.brightness < 96 && avg.edgeEnergy > 24) return "暗调高级感风";
  if (avg.saturation > 0.34 && avg.edgeEnergy > 24) return "高饱和社媒视觉风";
  if (avg.warmth > 10 && avg.brightness < 170) return "复古胶片生活方式风";
  if (avg.contrast < 38 && avg.edgeEnergy < 18) return "奶油柔焦氛围风";
  return "清透自然生活方式风";
}

function analyzeImageGroup(images) {
  if (!images.length) return null;
  const samples = images.map(sampleImage);
  const avg = averageSamples(samples);
  const palette = choosePalette(samples);
  const style = detectStyle(avg, images);
  const isBright = avg.brightness > 165;
  const isDark = avg.brightness < 96;
  const isColorful = avg.saturation > 0.32;
  const isSoft = avg.contrast < 38 && avg.edgeEnergy < 18;
  const isTextured = avg.edgeEnergy > 24 || avg.contrast > 52;
  const isWarm = avg.warmth > 10;

  const colorLabel = isColorful ? "亮色抓眼" : isWarm ? "暖调治愈" : isDark ? "低明度高级" : "清爽中性";
  const mood = isTextured ? "有层次、有细节" : isSoft ? "柔和松弛" : isBright ? "干净轻盈" : "克制耐看";
  const composition = images.some((image) => image.height > image.width * 1.15)
    ? "竖图占比较高，更接近小红书封面流的阅读习惯"
    : "横竖比例均衡，更接近 Ins moodboard 的同排对比";

  return {
    ...avg,
    palette,
    style,
    colorLabel,
    mood,
    composition,
    count: images.length,
  };
}

function analyzeImages() {
  const rows = groupRows();
  state.rowAnalyses = rows.map((row) => analyzeImageGroup(row));
  return analyzeImageGroup(state.images);
}

function fallbackRowDescription(analysis, rowIndex) {
  if (!analysis) return "";
  const unifiedStyle = state.analysis?.style || analysis.style;
  const role = rowRoles[rowIndex % rowRoles.length];
  const angle = aestheticAngles[rowIndex % aestheticAngles.length];
  const styleNote = {
    "小红书界面设计风": "界面截图感，重点看信息层级、卡片边界和留白。",
    "Ins 多图拼贴风": "多图 moodboard，重点看同排节奏、裁切比例和图片间距。",
    "波点元素装饰风": "波点 / 圆形元素，重点看重复节奏和轻装饰感。",
  }[unifiedStyle] || `${unifiedStyle}，重点看滤镜、光线和画面密度是否统一。`;

  const detailNotes = [
    `${analysis.colorLabel}，${analysis.mood}。`,
    `${analysis.composition}。`,
    `适合提取主体、留白、边框和局部元素。`,
    `适合统一成同一套发布图的节奏。`,
  ];

  return `${role}：${styleNote}${detailNotes[rowIndex % detailNotes.length]}${angle}`;
}

function rowDescription(analysis, rowIndex) {
  const custom = (state.rowDescriptions[rowIndex] || "").trim();
  return custom || fallbackRowDescription(analysis, rowIndex);
}

function buildInspirationText() {
  if (!state.analysis) return "上传图片后，这里会按每一排生成可直接下发给设计师或模型的风格描述。";

  const note = briefInput.value.trim();
  const rowTexts = state.rowAnalyses.map((analysis, index) => rowDescription(analysis, index));

  return [
    `今日灵感参考：整体归类「${state.analysis.style}」，${state.analysis.colorLabel}，${state.analysis.mood}。`,
    `拼接：每排 ${tileCount.value} 格，末排不足自动补白。`,
    ...rowTexts.map((text, index) => `参考 ${index + 1}：${text}`),
    note ? `补充要求：${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderThumbs() {
  thumbGrid.innerHTML = "";
  state.images.forEach((image, index) => {
    const card = document.createElement("article");
    card.className = "thumb-card";
    card.innerHTML = `<img alt="${image.name}" src="${image.src}" /><span>${index + 1}</span>`;
    const remove = document.createElement("button");
    remove.className = "remove-thumb";
    remove.type = "button";
    remove.textContent = "x";
    remove.title = "移除图片";
    remove.addEventListener("click", () => {
      state.images = state.images.filter((item) => item.id !== image.id);
      updateBoard();
    });
    card.append(remove);
    thumbGrid.append(card);
  });
}

function syncRowDescriptionLength(rowCount) {
  state.rowDescriptions = state.rowDescriptions.slice(0, rowCount);
  while (state.rowDescriptions.length < rowCount) {
    state.rowDescriptions.push("");
  }
}

function renderRowCopyEditor() {
  const rows = groupRows();
  rowCopyEditor.innerHTML = "";

  if (!rows.length) {
    rowCopyEditor.innerHTML = '<p class="empty-copy-tip">上传图片后可为每组参考填写自定义描述。</p>';
    return;
  }

  rows.forEach((row, index) => {
    const field = document.createElement("label");
    field.className = "row-copy-field";
    const fallback = fallbackRowDescription(state.rowAnalyses[index], index);
    field.innerHTML = `
      <span>参考 ${index + 1}</span>
      <textarea maxlength="140" data-row-index="${index}" placeholder="${fallback}"></textarea>
    `;
    const textarea = field.querySelector("textarea");
    textarea.value = state.rowDescriptions[index] || "";
    textarea.addEventListener("input", () => {
      state.rowDescriptions[index] = textarea.value;
      inspirationCopy.textContent = buildInspirationText();
      drawBoard();
    });
    rowCopyEditor.append(field);
  });
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawImageContain(context, image, x, y, width, height, radius = 18) {
  context.save();
  context.fillStyle = "#ffffff";
  drawRoundedRect(context, x, y, width, height, radius);
  context.fill();
  drawRoundedRect(context, x, y, width, height, radius);
  context.clip();

  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;

  if (sourceRatio > targetRatio) {
    drawHeight = width / sourceRatio;
  } else {
    drawWidth = height * sourceRatio;
  }

  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  context.drawImage(image.img, drawX, drawY, drawWidth, drawHeight);
  context.strokeStyle = "rgba(32, 33, 31, 0.08)";
  context.lineWidth = 2;
  drawRoundedRect(context, x + 1, y + 1, width - 2, height - 2, radius);
  context.stroke();
  context.restore();
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 20) {
  const paragraphs = text.split("\n");
  let lineCount = 0;
  let cursorY = y;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    let line = "";
    [...paragraph].forEach((char) => {
      const testLine = line + char;
      if (context.measureText(testLine).width > maxWidth && line) {
        if (lineCount < maxLines) context.fillText(line, x, cursorY);
        cursorY += lineHeight;
        lineCount += 1;
        line = char;
      } else {
        line = testLine;
      }
    });
    if (lineCount < maxLines) context.fillText(line, x, cursorY);
    cursorY += paragraphIndex === paragraphs.length - 1 ? lineHeight : lineHeight * 1.28;
    lineCount += 1;
  });

  return cursorY;
}

function drawPolkaPattern(context, color, width, height) {
  context.fillStyle = "#f8f7f2";
  context.fillRect(0, 0, width, height);
  context.fillStyle = `${color}24`;
  for (let y = 34; y < height; y += 54) {
    for (let x = 34; x < width; x += 54) {
      context.beginPath();
      context.arc(x + ((y / 54) % 2) * 16, y, 7, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawBlankSlot(context, x, y, width, height, index) {
  context.fillStyle = "#ffffff";
  drawRoundedRect(context, x, y, width, height, 18);
  context.fill();
  context.strokeStyle = "#dedbd1";
  context.lineWidth = 2;
  context.setLineDash([10, 12]);
  drawRoundedRect(context, x + 1, y + 1, width - 2, height - 2, 18);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = "#aaa69b";
  context.font = "500 22px Inter, sans-serif";
  ctx.fillText(`空位 ${index + 1}`, x + width / 2 - 34, y + height / 2 + 8);
}

function drawBoard() {
  const rows = groupRows();
  const slots = Number(tileCount.value);
  const analysis = state.analysis;
  const accent = headerAccentColor.value || analysis?.palette?.[0] || "#f4c95d";
  const headerBg = headerBgColor.value || "#1f2421";
  const subtitle = headerSubtitle.value.trim() || "小红书 / Ins 审美灵感横向参考";
  const rowGap = 52;
  const descHeight = 118;
  const headerHeight = 270;
  const topHeight = 350;
  const footerHeight = 34;
  const pageWidth = 1080;
  const margin = 64;
  const gap = slots === 4 ? 18 : 22;
  const cellWidth = (pageWidth - margin * 2 - gap * (slots - 1)) / slots;
  const rowHeight = cellWidth * 4 / 3;
  const rowBlockHeight = rowHeight + descHeight + rowGap;
  const longHeight = Math.max(1120, topHeight + Math.max(rows.length, 1) * rowBlockHeight + footerHeight + 28);

  boardCanvas.width = pageWidth;
  boardCanvas.height = longHeight;
  previewSize.textContent = `1080 x ${longHeight}`;

  if (analysis?.style === "波点元素装饰风") {
    drawPolkaPattern(ctx, accent, pageWidth, longHeight);
  } else {
    ctx.fillStyle = "#f7f5ef";
    ctx.fillRect(0, 0, pageWidth, longHeight);
  }

  ctx.fillStyle = headerBg;
  ctx.fillRect(0, 0, pageWidth, headerHeight);
  ctx.fillStyle = accent;
  ctx.fillRect(64, 58, 10, 126);

  ctx.fillStyle = "#fbfaf4";
  ctx.font = "700 54px Inter, sans-serif";
  ctx.fillText(boardTitle.value.trim() || "今日灵感参考", 96, 103);
  ctx.font = "400 26px Inter, sans-serif";
  ctx.fillStyle = "#dbe0dc";
  wrapText(ctx, subtitle, 96, 154, 800, 34, 2);

  ctx.font = "400 20px Inter, sans-serif";
  ctx.fillStyle = "#aeb8b2";
  ctx.fillText(analysis ? `${analysis.style} · ${rows.length} 组参考 · 每组 ${slots} 图` : `上传图片后生成 ${slots} 图横排参考`, 96, 226);

  if (!rows.length) {
    ctx.strokeStyle = "#d8d3c6";
    ctx.lineWidth = 2;
    for (let index = 0; index < slots; index += 1) {
      const x = margin + index * (cellWidth + gap);
      drawBlankSlot(ctx, x, topHeight, cellWidth, rowHeight, index);
    }
    ctx.fillStyle = "#73746f";
    ctx.font = "400 28px Inter, sans-serif";
    ctx.fillText("上传图片后，所有图片会按每排横向拼接", 64, topHeight + rowHeight + 70);
  }

  rows.forEach((row, rowIndex) => {
    const y = topHeight + rowIndex * rowBlockHeight;
    const rowAnalysis = state.rowAnalyses[rowIndex];

    ctx.fillStyle = "#20211f";
    ctx.font = "700 26px Inter, sans-serif";
    ctx.fillText(`参考 ${rowIndex + 1}`, margin, y - 18);
    ctx.fillStyle = "#6d6f69";
    ctx.font = "400 20px Inter, sans-serif";
    ctx.fillText(rowAnalysis ? `${analysis?.style || rowAnalysis.style} · ${rowAnalysis.count}/${slots} 图` : "", margin + 96, y - 18);

    for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
      const image = row[slotIndex];
      const x = margin + slotIndex * (cellWidth + gap);
      ctx.save();
      ctx.shadowColor = "rgba(32, 33, 31, 0.18)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      if (image) {
        drawImageContain(ctx, image, x, y, cellWidth, rowHeight, 18);
        ctx.fillStyle = "rgba(31, 36, 33, 0.72)";
        drawRoundedRect(ctx, x + 14, y + 14, 50, 32, 16);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 17px Inter, sans-serif";
        ctx.fillText(String(rowIndex * slots + slotIndex + 1).padStart(2, "0"), x + 27, y + 36);
      } else {
        drawBlankSlot(ctx, x, y, cellWidth, rowHeight, slotIndex);
      }
      ctx.restore();
    }

    const descY = y + rowHeight + 22;
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, margin, descY, pageWidth - margin * 2, 92, 18);
    ctx.fill();
    ctx.fillStyle = rowAnalysis?.palette?.[0] || accent;
    drawRoundedRect(ctx, margin + 20, descY + 20, 8, 52, 4);
    ctx.fill();
    ctx.fillStyle = "#343631";
    ctx.font = "400 22px Inter, sans-serif";
    wrapText(ctx, rowDescription(rowAnalysis, rowIndex), margin + 46, descY + 35, 858, 31, 2);
  });

}

async function updateBoard() {
  state.analysis = analyzeImages();
  syncRowDescriptionLength(groupRows().length);
  renderThumbs();
  renderRowCopyEditor();

  const count = state.images.length;
  const rows = groupRows();
  imageCount.textContent = String(count);
  selectedCount.textContent = String(rows.length);
  uploadMeter.style.width = `${clamp((count / Math.max(Number(tileCount.value), 1)) * 100, 0, 100)}%`;
  queueHint.textContent = count ? `${count} 张图片 / ${rows.length} 排` : "等待上传";
  statusText.textContent = count
    ? `已按每排 ${tileCount.value} 张生成横向拼接，末排自动补白`
    : "上传图片后会按每排 4 张自动拼接";
  downloadBoard.disabled = count === 0;
  copyBrief.disabled = count === 0;

  styleName.textContent = state.analysis?.style || "等待图片";
  colorMood.textContent = state.analysis?.colorLabel || "--";
  visualMood.textContent = state.analysis?.mood || "--";
  inspirationCopy.textContent = buildInspirationText();
  drawBoard();
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    if (!canvas.toBlob) {
      resolve(null);
      return;
    }
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

async function downloadCanvas() {
  if (!state.images.length) {
    statusText.textContent = "请先上传图片再下载长图";
    return;
  }

  drawBoard();
  const safeTitle = (boardTitle.value.trim() || "今日灵感参考").replace(/[\\/:*?"<>|]/g, "");
  const filename = `${safeTitle}-横排拼接长图.png`;

  try {
    const blob = await canvasToBlob(boardCanvas);
    if (!blob) throw new Error("当前浏览器不支持直接生成下载文件");

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "PNG 图片",
            accept: { "image/png": [".png"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      statusText.textContent = "长图已保存到你选择的位置";
      downloadBoard.textContent = "已保存";
      window.setTimeout(() => {
        downloadBoard.textContent = "下载长图";
      }, 1400);
      return;
    }

    const url = URL.createObjectURL(blob);
    manualDownloadLink.href = url;
    manualDownloadLink.download = filename;
    manualDownloadLink.hidden = false;
    statusText.textContent = "已生成长图，点击右上角“保存生成的长图”保存到下载文件夹";

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
  } catch (error) {
    try {
      const imageUrl = boardCanvas.toDataURL("image/png");
      manualDownloadLink.href = imageUrl;
      manualDownloadLink.download = filename;
      manualDownloadLink.hidden = false;
      statusText.textContent = "未弹出保存窗口，请点击右上角“保存生成的长图”";
    } catch {
      statusText.textContent = "生成下载失败，请减少图片数量后再试";
    }
  }
}

function clearAll() {
  state.images = [];
  state.rowDescriptions = [];
  imageInput.value = "";
  briefInput.value = "";
  manualDownloadLink.hidden = true;
  manualDownloadLink.removeAttribute("href");
  updateBoard();
}

imageInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
  event.target.value = "";
});

["dragenter", "dragover"].forEach((eventName) => {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.remove("dragging");
  });
});

uploadZone.addEventListener("drop", (event) => {
  handleFiles(event.dataTransfer.files);
});

importNote.addEventListener("click", importNoteAssets);
noteUrlInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    importNoteAssets();
  }
});

[tileCount, layoutMode, boardTitle, headerSubtitle, headerBgColor, headerAccentColor, briefInput].forEach((control) => {
  control.addEventListener("input", updateBoard);
  control.addEventListener("change", updateBoard);
});

downloadBoard.addEventListener("click", downloadCanvas);
clearBoard.addEventListener("click", clearAll);
copyBrief.addEventListener("click", async () => {
  const text = buildInspirationText();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  copyBrief.textContent = "已复制";
  window.setTimeout(() => {
    copyBrief.textContent = "复制";
  }, 1200);
});

updateBoard();
