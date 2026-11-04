// 项目类型定义
export interface Project {
  id: number;
  name: string;
  location: string; // 城市/区域
  type: 'highway' | 'municipal' | 'rural' | 'industrial' | 'port'; // 工程类型
  coordinates?: [number, number]; // 经纬度 [lng, lat]
}

// 重点展示区域中心
export const REGIONS = {
  qingdao: {
    name: "山东省青岛市黄岛区",
    center: [120.19, 35.95] as [number, number]
  },
  binzhou: {
    name: "山东省滨州市",
    center: [117.97, 37.38] as [number, number]
  }
};

// 所有监测项目列表
export const MONITOR_PROJECTS: Project[] = [
  { id: 1, name: "济青高速公路改扩建工程", location: "山东省", type: "highway", coordinates: [118.5, 36.8] },
  { id: 2, name: "国道G309公路滨州段", location: "滨州市", type: "highway", coordinates: [117.97, 37.38] },
  { id: 3, name: "淄博市政东一路", location: "淄博市", type: "municipal", coordinates: [118.05, 36.8] },
  { id: 4, name: "聊城周庄农村公路工程", location: "聊城市", type: "rural", coordinates: [115.97, 36.45] },
  { id: 5, name: "滨州北海静脉路网工程", location: "滨州市", type: "industrial", coordinates: [118.0, 37.5] },
  { id: 6, name: "中铝齐鲁工业园区道路", location: "淄博市", type: "industrial", coordinates: [118.1, 36.9] },
  { id: 7, name: "贵州贵黔高速连接线", location: "贵州省", type: "highway", coordinates: [106.6, 26.6] },
  { id: 8, name: "淄博市政东路赤泥路基程项目", location: "淄博市", type: "municipal", coordinates: [118.06, 36.82] },
  { id: 9, name: "滨州北海静脉产业园路网一期", location: "滨州市", type: "industrial", coordinates: [118.02, 37.52] },
  { id: 10, name: "交通运输部济青高速赤泥推广工程", location: "山东省", type: "highway", coordinates: [119.0, 36.7] },
  { id: 11, name: "山东魏桥20万吨石膏粉厂区道路", location: "滨州市", type: "industrial", coordinates: [117.9, 37.3] },
  { id: 12, name: "中铝齐鲁工业园铝基新材料产业园道路", location: "淄博市", type: "industrial", coordinates: [118.12, 36.92] },
  { id: 13, name: "国道309一级公路滨州段赤泥路基", location: "滨州市", type: "highway", coordinates: [117.95, 37.36] },
  { id: 14, name: "龙口市南山铝业赤泥回填港口工程", location: "烟台市", type: "port", coordinates: [120.5, 37.6] },
  { id: 15, name: "聊城市茌平周庄村环村南路", location: "聊城市", type: "rural", coordinates: [116.0, 36.5] },
  { id: 16, name: "河南省平顶山市农村公路赤泥试验", location: "平顶山市", type: "rural", coordinates: [113.3, 33.7] },
  { id: 17, name: "贵州省清镇市贵黔高速连接线试验", location: "贵州省", type: "highway", coordinates: [106.5, 26.5] },
  { id: 18, name: "滨州宏通资源综合利用公司厂区道路", location: "滨州市", type: "industrial", coordinates: [118.0, 37.4] },
  { id: 19, name: "沾化港口物流有限公司一期码头道路", location: "滨州市", type: "port", coordinates: [118.1, 37.8] },
  { id: 20, name: "山东滨华新材料碳三碳四利用工程", location: "滨州市", type: "industrial", coordinates: [118.05, 37.45] },
  { id: 21, name: "山东魏桥海逸环保科技厂区道路", location: "滨州市", type: "industrial", coordinates: [117.92, 37.32] },
  { id: 22, name: "邹平伊文华源金属科技赤泥堆场坡道", location: "滨州市", type: "industrial", coordinates: [117.7, 36.9] },
  { id: 23, name: "山东魏桥环保科技成品仓储区地基回填", location: "滨州市", type: "industrial", coordinates: [117.93, 37.33] },
  { id: 24, name: "魏桥铝电集团年产赤泥球团基础工程", location: "滨州市", type: "industrial", coordinates: [117.94, 37.34] },
  { id: 25, name: "滨州北海汇宏新材料厂区道路", location: "滨州市", type: "industrial", coordinates: [118.03, 37.53] },
  { id: 26, name: "中国铝业广西分公司赤泥干堆场道路", location: "广西", type: "industrial", coordinates: [107.5, 23.3] },
  { id: 27, name: "滨州市北海信和新材料厂区道路", location: "滨州市", type: "industrial", coordinates: [118.04, 37.54] },
  { id: 28, name: "邹平伊文华源金属科技厂区道路", location: "滨州市", type: "industrial", coordinates: [117.72, 36.92] },
  { id: 29, name: "邹平县汇茂新材料科技厂区道路", location: "滨州市", type: "industrial", coordinates: [117.75, 36.95] },
];
