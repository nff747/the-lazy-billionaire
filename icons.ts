
import React from 'react';

// Refactored to use React.createElement to avoid JSX syntax in a .ts file.
export const Icons = {
  Money: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('line', { x1: "12", y1: "1", x2: "12", y2: "23" }),
    React.createElement('path', { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })
  ),
  Tech: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('polyline', { points: "16 18 22 12 16 6" }),
    React.createElement('polyline', { points: "8 6 2 12 8 18" })
  ),
  Luxury: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M6 3h12l4 6-10 12L2 9z" }),
    React.createElement('path', { d: "M11 3l-4 6 5 11 5-11-4-6" }),
    React.createElement('path', { d: "M2 9h20" })
  ),
  Finance: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('line', { x1: "12", y1: "20", x2: "12", y2: "10" }),
    React.createElement('line', { x1: "18", y1: "20", x2: "18", y2: "4" }),
    React.createElement('line', { x1: "6", y1: "20", x2: "6", y2: "16" })
  ),
  Entertainment: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('rect', { x: "2", y: "2", width: "20", height: "20", rx: "2.18", ry: "2.18" }),
    React.createElement('line', { x1: "7", y1: "2", x2: "7", y2: "22" }),
    React.createElement('line', { x1: "17", y1: "2", x2: "17", y2: "22" }),
    React.createElement('line', { x1: "2", y1: "12", x2: "22", y2: "12" }),
    React.createElement('line', { x1: "2", y1: "7", x2: "7", y2: "7" }),
    React.createElement('line', { x1: "2", y1: "17", x2: "7", y2: "17" }),
    React.createElement('line', { x1: "17", y1: "17", x2: "22", y2: "17" }),
    React.createElement('line', { x1: "17", y1: "7", x2: "22", y2: "7" })
  ),
  Space: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }),
    React.createElement('path', { d: "M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }),
    React.createElement('path', { d: "M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" }),
    React.createElement('path', { d: "M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" })
  ),
  Energy: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('polygon', { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })
  ),
  Cosmic: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('circle', { cx: "12", cy: "12", r: "10" }),
    React.createElement('path', { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" }),
    React.createElement('path', { d: "M2 12h20" })
  ),
  Legacy: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5" })
  ),
  Diamond: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M6 3h12l4 6-10 12L2 9z" }),
    React.createElement('path', { d: "M11 3l-4 6 5 11 5-11-4-6" }),
    React.createElement('path', { d: "M2 9h20" })
  ),
  Shield: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })
  ),
  Lock: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('rect', { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
    React.createElement('path', { d: "M7 11V7a5 5 0 0 1 10 0v4" })
  ),
  Unlock: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('rect', { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
    React.createElement('path', { d: "M7 11V7a5 5 0 0 1 9.9-1" })
  ),
  Bull: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('polyline', { points: "23 6 13.5 15.5 8.5 10.5 1 18" }),
    React.createElement('polyline', { points: "17 6 23 6 23 12" })
  ),
  Bear: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('polyline', { points: "23 18 13.5 8.5 8.5 13.5 1 6" }),
    React.createElement('polyline', { points: "17 18 23 18 23 12" })
  ),
  Flat: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('line', { x1: "3", y1: "12", x2: "21", y2: "12" })
  ),
  Key: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('circle', { cx: "7.5", cy: "15.5", r: "5.5" }),
    React.createElement('path', { d: "m21 2-9.6 9.6" }),
    React.createElement('path', { d: "m15.5 7.5 3 3L22 7l-3-3" })
  ),
  Send: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('line', { x1: "22", y1: "2", x2: "11", y2: "13" }),
    React.createElement('polygon', { points: "22 2 15 22 11 13 2 9 22 2" })
  ),
  Google: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" })
  ),
  Email: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
    React.createElement('polyline', { points: "22,6 12,13 2,6" })
  ),
  User: () => React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement('path', { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
    React.createElement('circle', { cx: "12", cy: "7", r: "4" })
  )
};
