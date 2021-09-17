import { RefObject, useCallback, useEffect, useState } from 'react';
import { NestPoint, randomPoints, lowerAlpha } from './utils';

/** 在canvas上画点 */
function drawPoint(context: CanvasRenderingContext2D, point: NestPoint, color: string) {
  if (point.x <= -1 || point.y <= -1) return;
  if (point.isMouse) {
    context.fillStyle = color;
    context.fillRect(point.x - 5, point.y - 5, 10, 10);
  } else {
    context.fillStyle = color;
    context.fillRect(point.x - 0.5, point.y - 0.5, 1, 1);
  }
}

/** 在canvas上画线 */
function drawLine(
  context: CanvasRenderingContext2D,
  pointStart: NestPoint,
  pointEnd: NestPoint,
  color: string,
  lineWidth: number
) {
  context.beginPath();
  context.lineWidth = lineWidth;
  context.strokeStyle = color;
  context.moveTo(pointStart.x, pointStart.y);
  context.lineTo(pointEnd.x, pointEnd.y);
  context.stroke();
}

/**
 * 在指定Canvas元素上渲染巢状图
 * @param targetRef 渲染目标HTMlCanvasElement 的 ref
 * @param color 颜色
 * @param density 密度
 */
export default function useCanvasNest(
  targetRef: RefObject<HTMLCanvasElement>,
  color: string,
  density: number,
  follow = true
) {
  const [mouse, setMouse] = useState<NestPoint>({ x: -1, y: -1, mx: 0, my: 0, max: 6000, isMouse: true });
  const [points, setPoints] = useState<NestPoint[]>([]);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  function onMousemove(event: MouseEvent) {
    const { pageX, pageY } = event;
    setMouse({ x: pageX, y: pageY, mx: 0, my: 0, max: 6000, isMouse: true });
  }
  function onMouseOut() {
    setMouse({ x: -1, y: -1, mx: 0, my: 0, max: 6000, isMouse: true });
  }

  /** 在画布上绘制 */
  function drawCanvas() {
    if (!context || !targetRef.current) return;
    const { offsetHeight: height, offsetWidth: width } = targetRef.current;
    context.clearRect(0, 0, width, height);
    let pointsWithMouse = follow ? points : points.concat(mouse);

    pointsWithMouse.forEach((point, idx) => {
      if (!point.isMouse) {
        point.x += point.mx;
        point.x += point.my;
        point.mx *= point.x > width || point.x < 0 ? -1 : 1;
        point.my *= point.y > height || point.y < 0 ? -1 : 1;
      }
      drawPoint(context, point, color);
      for (let i = idx + 1; i < pointsWithMouse.length; i++) {
        const next_point = pointsWithMouse[i];
        const x_dist = point.x - next_point.x;
        const y_dist = point.y - next_point.y;
        const dist = x_dist * x_dist + y_dist * y_dist;

        /** 进入吸附距离 */
        if (dist < next_point.max) {
          if (next_point.isMouse && dist >= next_point.max / 2) {
            point.x -= 0.03 * x_dist;
            point.y -= 0.03 * y_dist;
          }
          const d = (next_point.max - dist) / next_point.max;
          drawLine(context, point, next_point, lowerAlpha(color, 0.5), d / 2);
        }
      }
    });

    requestAnimationFrame(drawCanvas);
  }
  useEffect(() => {
    if (typeof window == 'undefined' || !targetRef.current) return;
    const parentElement = targetRef.current.parentElement as HTMLElement;
    const { offsetHeight: height, offsetWidth: width } = targetRef.current;
    setContext(targetRef.current.getContext('2d') as CanvasRenderingContext2D);
    setPoints(randomPoints(density, width, height));

    targetRef.current.width = width;
    targetRef.current.height = height;

    requestAnimationFrame(drawCanvas);

    parentElement.addEventListener('mousemove', onMousemove);
    parentElement.addEventListener('mouseout', onMouseOut);
    return () => {
      parentElement.removeEventListener('mousemove', onMousemove);
      parentElement.removeEventListener('mouseout', onMouseOut);
    };
  }, []);
}
