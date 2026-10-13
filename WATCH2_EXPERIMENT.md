# Watch2 A/B 対照実験

## 目的
過去に高精度だった候補コードと、方位を粗く扱い高度を主指標にする新方式を、同一条件で比較する。

## A条件: 高精度候補 CONTROL
- PR: #36
- branch: `experiment/watch2-high-accuracy-control`
- measurement logic snapshot: `fa45d6915e354bd6cb09b38640278ae6cc122c0f`
- 3D背面カメラ光軸 elevation を主値として使用
- strict quality gate
- continuous azimuth + elevation の角距離で時刻推定
- **変更禁止。対照実験中は固定する。**

## B条件: 粗方位 + 高度主体
- branch: `experiment/watch2-coarse-heading-elevation-primary`
- page: `watch2-elevation-dominant.html`
- 現行の iPhone 方位補正ロジックを維持
- 方位は8方位または16方位に分類
- 同じ方位区分に太陽が存在する候補時刻を優先
- 同一区分候補内では `|predicted elevation - observed elevation|` を主評価値として時刻を選択
- exact azimuth difference は推定順位に使用せず診断値として保存
- 同一区分候補が存在しない場合のみ隣接区分を fallback として許可
- 高度は `camera3d_optical_elevation_deg` を使用し、[-90,+90] の物理範囲を必須とする

## 変更していないもの
今回のB条件実装では既存の `iphone-field.html` を変更しない。
以下は既存方式をそのまま維持する。
- `webkitCompassHeading`
- iPhone 180° jump / parity correction
- 50ms sampling
- 10秒 measurement session
- GPS取得
- camera preview / reticle

## 推奨する最初の実験
同じ端末、同じ場所、できるだけ短い間隔で以下を実施する。

1. A条件を3回
2. B条件 8方位を3回
3. B条件 16方位を3回

各測定でCSVを保存する。

## 主評価項目
1. `abs(mvp_time_error_min)`
2. `abs(actual_elevation_error_deg)`
3. `mvp_elevation_abs_error_deg`
4. 測定成功率
5. 同一条件での再現性

補助評価:
- `actual_azimuth_error_deg`
- `mvp_angular_residual_deg`
- 方位区分一致率

## 判定の考え方
B条件の狙いは「磁気方位の細かな誤差を捨てても、高度主体で時刻推定精度を維持または改善できるか」である。

したがってB条件では exact azimuth error が大きくても、
- 方位区分が正しい
- elevation error が小さい
- time error が小さい

なら方式として成功候補とみなす。

## 保守ルール
- A条件は変更しない。
- B条件の改良時も、今回追加したページ以外をついでに変更しない。
- 実験途中で閾値や区分数を変更した場合は別 condition ID を使用する。
- 8方位と16方位の結果を同じ条件として混ぜない。
- 実装変更前のCSVは削除しない。
