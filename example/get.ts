import * as querystring from "querystring";
import { Request } from "../src";

(async () => {
  // 请先查看 test/bind.ts，接码成功后的 getCookie() 对象，传入此处
  const request = new Request({
    openid: "getCookie().openid",
    sign: "getCookie().sign",
    sid: "getCookie().sid"
  });
  const url =
    "https://h5.ele.me/hongbao/#hardware_id=&is_lucky_group=True&lucky_number=7&track_id=&platform=0&sn=10fbda7a6c8e8012&theme_id=2881&device_id=&refer_user_id=21150550";
  const query = querystring.parse(url);
  const sn = <string>query.sn;
  if (sn) {
    console.log(sn);
    const luckyNumber = await request.getLuckyNumber(sn);
    if (luckyNumber) {
      console.log(`是拼手气链接，第${luckyNumber}个最大`);
      const res = await request.getHongbao(sn);
      console.log("领取结果", res);
      // 可以通过 ret_code 来判断领取情况，请参考 https://github.com/mtdhb/get 对领取结果的处理方式
    } else {
      console.log("不是拼手气链接");
    }
  } else {
    console.log("链接不正确");
  }
})();
