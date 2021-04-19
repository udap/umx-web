import { useEffect, useState } from 'react';
import { Modal, Avatar } from 'antd';
import NumberFormat from 'react-number-format';
import QRCode from 'qrcode.react';
var Stomp = require('stompjs');
import dayjs from 'dayjs';
import { history } from 'umi';

import styles from './Auction.less';
import { getAuthor, getMarkets, getBidsTops } from '@/services/auction';
import { BidGraph, WorkSale, ImageLabel, CountDown } from '@/components';
import { WeChat, TikTok, magnifier, weibo } from '@/images';
import { padLeft } from '@/utils/common';
import { WX_APPID } from '@/utils/constants';
import * as tsDefault from '@/utils/tsDefault';

interface QueryProps {
  workId: string;
  authorId: string;
}

interface AuthInfoType {
  headImage: string;
  name: string;
  nickName: string;
}

interface BidTopsType {
  bidder: {
    id: string;
    name: string;
  };
  createdDate: number;
  id: string;
  price: number;
}

const Auction = () => {
  const defaultAuthInfo = {
    headImage: '',
    name: '',
    nickName: '',
  };

  const defaultBidTops = [
    {
      bidder: {
        id: '',
        name: '',
      },
      createdDate: 0,
      id: '',
      price: 0,
    },
  ];

  const [authorInfo, setAuthorInfo] = useState<AuthInfoType>(defaultAuthInfo);
  const [markets, setMarkets] = useState<API.MarketsType>(
    tsDefault.DEFAULT_MARKETS,
  );
  const [bidsTops, setBidsTops] = useState<BidTopsType[]>(defaultBidTops);
  const [liveVisible, setLiveVisible] = useState(false);
  const [liveMethod, setLiveMethod] = useState('');
  const [wechatUrl, setWechatUrl] = useState('');

  const fetchAuthor = async () => {
    try {
      if (markets.userId) {
        const result = await getAuthor(markets.userId);
        if (result?.data && result.data instanceof Object) {
          setAuthorInfo(result.data);
        }
      }
    } catch (error) {
      console.log('fetchAuthor', error);
    }
  };

  const fetchData = async () => {
    const { workId } = (history.location.query as unknown) as QueryProps;

    Promise.all([getMarkets(workId), getBidsTops({ productId: workId })]).then(
      (res) => {
        if (res[0].data) {
          setMarkets(res[0].data);
        }
        if (res[1].data) {
          setBidsTops(res[1].data);
        }
      },
    );
  };

  useEffect(() => {
    fetchData();

    let url = 'wss://api.umx.art/message/ws';
    let stompClient = Stomp.client(url);
    stompClient.connect(
      {},
      (frame: string) => {
        // 连接成功
        // setConnected(true);
        console.log('Connected: ' + frame);
        stompClient.subscribe(
          '/exchange/udap.sys.notice/auction.price',
          (greeting: { body: string }) => {
            // 订阅成功
            const greetingBody = JSON.parse(greeting.body);

            const hasBiderArr = bidsTops.filter(
              (item, index) =>
                item.bidder.id === greetingBody.content?.bidder.id,
            );

            let tempArr: any = [];
            if (hasBiderArr.length) {
              bidsTops.forEach((item, index) => {
                if (item.bidder.id === greetingBody.content?.bidder.id) {
                  tempArr.push(greetingBody.content);
                  return;
                }
                tempArr.push(item);
              });
            } else {
              tempArr = [...bidsTops, greetingBody.content];
            }
            setBidsTops(tempArr);
          },
          function (err: any) {
            // 订阅失败
            console.log('err', err);
          },
        );
      },
      (error: any) => {
        // 连接失败
        console.log('connectFail', error);
      },
    );
  }, []);

  useEffect(() => {
    console.log('userId');
    fetchAuthor();
  }, [markets.userId]);

  const onLiveCancel = () => {
    setLiveVisible(false);
  };

  const onLiveClick = (ele: string) => {
    switch (ele) {
      case 'WeChat':
        const { workId } = (history.location.query as unknown) as QueryProps;
        const encodeUrl = encodeURIComponent(
          `https://h5.umx.art/auction?workId=${workId}`,
        );
        const wechatQR = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WX_APPID}&redirect_uri=http%3A%2F%2Fumx.iclass.cn%2Fwechat%2Foauth_response&response_type=code&scope=snsapi_userinfo&state=${encodeUrl}#wechat_redirect`;

        setWechatUrl(wechatQR);

        setLiveMethod(ele);
        setLiveVisible(true);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    const compare = (property: string) => {
      return function (a: { [x: string]: any }, b: { [x: string]: any }) {
        const value1 = a[property];
        const value2 = b[property];
        return value2 - value1;
      };
    };

    const sortBidsTops = bidsTops.sort(compare('price'));
    setBidsTops(sortBidsTops);
  }, [bidsTops]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.workContainer}>
          <div className={styles.contentLeft}>
            <WorkSale>
              <img src={markets.image} alt="workImg" />
            </WorkSale>
            <div className={styles.magnifier}>
              <img src={magnifier} alt="magnifier" />
              <div>查看作品介绍详情</div>
            </div>
          </div>
          <div className={styles.contentRight}>
            <div className={styles.rightTop}>
              <div className={styles.rightWork}>
                <div className={styles.thirdShare}>
                  <ImageLabel image={TikTok} label="直播间" />
                  <ImageLabel
                    image={weibo}
                    label="#La Rue Saint-Rustique à Montmartre#"
                  />
                  <ImageLabel image={WeChat} label="微信主题讨论群" />
                </div>
                <div className={styles.info}>
                  <div className={styles.workName}>{markets.name}</div>
                  <div className={styles.des}>
                    <div className={styles.codeCopies}>
                      序列号 {markets.code} 发行量{markets.copies}份
                    </div>
                    <div className={styles.permissionDes}>用户购买权限说明</div>
                  </div>
                  <div className={styles.address}>
                    区块链：{markets.contractaddress}
                  </div>
                  <CountDown
                    saleStartTime={markets.saleStartTime}
                    saleEndTime={markets.saleEndTime}
                  />
                  <div className={styles.priceBox}>
                    <div className={styles.saleBox}>
                      <div className={styles.saleMethod}>竞价</div>
                      <div className={styles.salePrice}>售价</div>
                    </div>
                    <div className={styles.price}>
                      <NumberFormat
                        value={markets.price}
                        thousandSeparator={true}
                        fixedDecimalScale={true}
                        displayType={'text'}
                        prefix={'¥'}
                      />
                    </div>
                  </div>
                  <ImageLabel
                    image={WeChat}
                    label="微信参与购买"
                    width={41}
                    height={41}
                    onClick={() => onLiveClick('WeChat')}
                  />
                </div>
              </div>
              <div className={styles.rightAvatar}>
                <div className={styles.worker}>
                  <WorkSale>
                    <Avatar src={authorInfo.headImage} size={48} />
                  </WorkSale>
                  <div className={styles.authorName}>{authorInfo.name}</div>
                </div>
              </div>
            </div>
            {markets.saleStatus === 'ACTIVE' && (
              <>
                <div className={styles.authTips}>
                  {dayjs(new Date()).valueOf() >
                  dayjs(markets.saleEndTime).valueOf()
                    ? `拍卖结束，中签为下方001${
                        markets.copies !== 1
                          ? `-${padLeft(markets.copies, 3)}`
                          : ''
                      }用户，请在微信中支付加价的尾款`
                    : '拍卖首次出价需全款付清，如你中签，加价金额会在拍卖结束后5分钟内付清'}
                </div>
                <BidGraph bidList={bidsTops} copies={markets.copies} />
              </>
            )}
          </div>
        </div>
      </div>
      <Modal
        title=""
        visible={liveVisible}
        onCancel={onLiveCancel}
        footer={null}
        width={368}
        destroyOnClose
        centered
        closable={false}
      >
        <QRCode
          id="qrcode"
          value={wechatUrl}
          renderAs={'svg'}
          size={320}
          level={'H'}
          imageSettings={{
            src: liveMethod === 'WeChat' ? WeChat : TikTok,
            height: 48,
            width: 48,
            excavate: true,
          }}
        />
      </Modal>
    </>
  );
};

export default Auction;
