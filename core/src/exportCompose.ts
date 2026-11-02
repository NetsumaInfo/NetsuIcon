import { num } from './svg';
import type { IconDoc, IconNode, Style } from './types';

const HEADER = `package com.netsuma.netsurush.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

`;

const HELPERS = `private class IconPath(
    val data: String,
    val fill: Boolean,
    val stroke: Boolean,
    val width: Float,
    val evenOdd: Boolean,
)

private fun stroke(data: String, width: Float = 2f) = IconPath(data, false, true, width, false)
private fun fill(data: String, evenOdd: Boolean = false) = IconPath(data, true, false, 2f, evenOdd)
private fun fillStroke(data: String, width: Float = 2f, evenOdd: Boolean = false) = IconPath(data, true, true, width, evenOdd)

private fun icon(name: String, vararg paths: IconPath): ImageVector =
    ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f).apply {
        paths.forEach {
            addPath(
                pathData = PathParser().parsePathString(it.data).toNodes(),
                pathFillType = if (it.evenOdd) PathFillType.EvenOdd else PathFillType.NonZero,
                fill = if (it.fill) SolidColor(Color.White) else null,
                stroke = if (it.stroke) SolidColor(Color.White) else null,
                strokeLineWidth = it.width,
                strokeLineCap = StrokeCap.Round,
                strokeLineJoin = StrokeJoin.Round,
            )
        }
    }.build()

`;

function pascal(name: string): string {
  return name.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

/** A rounded rectangle, a circle and the rest as path data: Compose only parses paths. */
function pathData(node: IconNode): string {
  switch (node.type) {
    case 'path':
      return node.d;
    case 'line':
      return `M${num(node.x1)} ${num(node.y1)}L${num(node.x2)} ${num(node.y2)}`;
    case 'circle':
      return pathData({ ...node, type: 'ellipse', rx: node.r, ry: node.r });
    case 'ellipse': {
      const { cx, cy, rx, ry } = node;
      return `M${num(cx - rx)} ${num(cy)}a${num(rx)} ${num(ry)} 0 1 0 ${num(2 * rx)} 0a${num(rx)} ${num(ry)} 0 1 0 ${num(-2 * rx)} 0z`;
    }
    case 'rect': {
      const { x, y, width: w, height: h } = node;
      const r = Math.min(node.rx ?? 0, w / 2, h / 2);
      if (r === 0) return `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}z`;
      const arc = (dx: number, dy: number) => `a${num(r)} ${num(r)} 0 0 1 ${num(dx)} ${num(dy)}`;
      return `M${num(x + r)} ${num(y)}h${num(w - 2 * r)}${arc(r, r)}v${num(h - 2 * r)}${arc(-r, r)}h${num(2 * r - w)}${arc(-r, -r)}v${num(2 * r - h)}${arc(r, -r)}z`;
    }
    case 'group':
      return '';
  }
}

function paintsFill(value: string | undefined): boolean {
  return value !== undefined && value !== 'none';
}

function call(node: IconNode, style: Style): string {
  const data = JSON.stringify(pathData(node));
  const filled = paintsFill(style.fill);
  const stroked = paintsFill(style.stroke);
  const width = style.strokeWidth ?? 2;
  const widthArg = width === 2 ? '' : `, ${num(width)}f`;
  const evenOdd = style.fillRule === 'evenodd';
  if (filled && stroked) return `fillStroke(${data}${widthArg}${evenOdd ? ', evenOdd = true' : ''})`;
  if (filled) return `fill(${data}${evenOdd ? ', evenOdd = true' : ''})`;
  return `stroke(${data}${widthArg})`;
}

function shapes(nodes: IconNode[], inherited: Style, name: string): string[] {
  return nodes.flatMap((node) => {
    if (node.hidden) return [];
    if (node.translate || node.rotate || node.scale || node.opacity !== undefined || node.draw !== undefined || node.trim) {
      throw new Error(`Icon "${name}": node "${node.id}" is moved or faded; a Compose icon is still.`);
    }
    const style: Style = {
      fill: node.fill ?? inherited.fill,
      stroke: node.stroke ?? inherited.stroke,
      strokeWidth: node.strokeWidth ?? inherited.strokeWidth,
      fillRule: node.fillRule ?? inherited.fillRule,
    };
    return node.type === 'group' ? shapes(node.children, style, name) : [call(node, style)];
  });
}

/**
 * A Kotlin file with `object Icons`: one lazy `ImageVector` per icon, white strokes of the width of the pack on a
 * grid of 24 (round caps and joins), filled in white where the shape is filled. Icons must be drawn already
 * (`resolve`): colours come out as white, so only the presence of a fill or a stroke matters. Written in the
 * order given.
 */
export function exportCompose(docs: IconDoc[], source: string): string {
  const lines = docs.map((doc) => {
    if (doc.size !== 24) throw new Error(`Icon "${doc.name}": the view box is ${doc.size}, Compose icons use 24.`);
    const name = pascal(doc.name);
    const body = shapes(doc.nodes, doc.defaults ?? {}, doc.name).map((one) => `            ${one},`).join('\n');
    return `    val ${name} by lazy {\n        icon(\n            "${name}",\n${body}\n        )\n    }`;
  });
  return `${HEADER}// Généré par NetsuIcon (${source}). Ne pas modifier à la main : changer l'icône dans NetsuIcon puis relancer l'export.\n${HELPERS}object Icons {\n${lines.join('\n')}\n}\n`;
}
