import axios, {
  AxiosInstance,
  AxiosProxyConfig,
  AxiosRequestConfig,
  AxiosResponse
} from "axios";
import * as querystring from "querystring";

export interface Cookie {
  openid: string;
  sign: string;
  sid?: string;
}

export class Request {
  private axios: AxiosInstance;
  private cookie: Cookie;
  private mobile: string;
  private validateToken: string;

  private static createXShared(sn: string = "29e47b57971c1c9d"): string {
    return `eosid=${parseInt(sn, 16)}`;
  }

  /**
   * 每一个小号需要实例化一次
   * @param {string} cookie 授权登录饿了么的QQ或者WX号Cookie
   * @param {AxiosProxyConfig} proxy 代理配置
   */
  constructor(cookie: Cookie, proxy?: AxiosProxyConfig) {
    this.cookie = cookie;
    this.axios = axios.create({
      proxy,
      baseURL: "https://h5.ele.me",
      method: "POST",
      headers: {
        referer: "https://h5.ele.me/hongbao/",
        origin: "https://h5.ele.me",
        "x-shard": Request.createXShared(),
        "user-agent":
          "Mozilla/5.0 (Linux; Android 7.0; MIX Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044004 Mobile Safari/537.36 V1_AND_SQ_7.5.0_794_YYB_D QQ/7.5.0.3430 NetType/WIFI WebP/0.3.0 Pixel/1080"
      }
    });
  }

  /**
   * 底层请求，一般不要直接调用
   * @param {string} method 请求方式
   * @param {string} url 请求地址
   * @param data 请求数据
   * @param {AxiosRequestConfig} config 其它配置
   * @returns {Promise<AxiosResponse>}
   * @private
   */
  private async _request(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    try {
      return await this.axios[method](url, querystring.stringify(data), config);
    } catch (e) {
      return e.response;
    }
  }

  /**
   * 获取绑定好的cookie数据
   * @returns {Cookie}
   */
  getCookie(): Cookie {
    return <Cookie>{ ...this.cookie };
  }

  /**
   * 领取红包
   * @param {string} sn 红包链接标识
   * @param {string} headimgurl 领取的头像URL
   * @param {string} nickname 领取的昵称
   * @returns {Promise<object>}
   */
  async getHongbao(
    sn: string,
    headimgurl: string = "",
    nickname: string = ""
  ): Promise<object> {
    const { data } = await this._request(
      "post",
      `/restapi/marketing/promotion/weixin/${this.cookie.openid}`,
      {
        device_id: "",
        group_sn: sn,
        hardware_id: "",
        method: "phone",
        phone: "",
        platform: 4,
        sign: this.cookie.sign,
        track_id: "",
        unionid: "fuck",
        weixin_avatar: headimgurl,
        weixin_username: nickname
      },
      {
        headers: {
          "x-shard": Request.createXShared(sn),
          cookie: `SID=${this.cookie.sid}`
        }
      }
    );
    return data;
  }

  /**
   * 根据 sn 获取拼手气大包是第几个
   * @param {string} sn 红包链接标识
   * @returns {Promise<number>}
   */
  async getLuckyNumber(sn: string): Promise<number> {
    const {
      data: { lucky_number }
    } = await this._request(
      "get",
      `/restapi/marketing/themes/0/group_sns/${sn}`
    );
    return lucky_number;
  }

  /**
   * 绑定 sendMobileCode 传入的手机号码，需要先调用 loginByMobile
   * @returns {Promise<object>}
   */
  async changeMobile(): Promise<object> {
    const { data } = await this._request(
      "post",
      `/restapi/marketing/hongbao/weixin/${this.cookie.openid}/change`,
      {
        phone: this.mobile,
        sign: this.cookie.sign
      },
      {
        headers: {
          cookie: `SID=${this.cookie.sid}`
        }
      }
    );
    return data;
  }

  /**
   * 使用短信验证码登录，需要先调用 sendMobileCode
   * @param {string} validateCode 短信验证码
   * @returns {Promise<string>}
   */
  async loginByMobile(validateCode: string): Promise<string> {
    const {
      data: { user_id },
      headers
    } = await this._request("post", "/restapi/eus/login/login_by_mobile", {
      mobile: this.mobile,
      validate_code: validateCode,
      validate_token: this.validateToken
    });
    const sid = headers["set-cookie"].find(
      (c: string) => c.split("; ")[0].indexOf("SID") === 0
    );
    if (sid) {
      this.cookie.sid = sid.split("; ")[0].split("=")[1];
    }
    return user_id;
  }

  /**
   * 发送短信验证码
   * @param {string} mobile 手机号码
   * @param {string} captcha_hash 图形验证码标识
   * @param {string} captcha_value 图形验证码内容
   * @returns {Promise<string>}
   */
  async sendMobileCode(
    mobile: string,
    captcha_hash: string = "",
    captcha_value: string = ""
  ): Promise<string> {
    const {
      data: { validate_token }
    } = await this._request("post", "/restapi/eus/login/mobile_send_code", {
      mobile,
      captcha_hash,
      captcha_value
    });
    this.mobile = mobile;
    this.validateToken = validate_token;
    return validate_token;
  }
}
