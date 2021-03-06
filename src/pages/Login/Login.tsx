import { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import { useInterval } from 'ahooks';
import { history } from 'umi';

import styles from './Login.less';
import { randomString } from '@/utils/common';
import { UMedia } from '@/images';
import { searchQrCodeInfo } from '@/services';

const Login = () => {
  const [interval, setInterval] = useState<number | null>(1000);

  const randomKeys = randomString(19);

  const fetchData = async () => {
    try {
      const result = await searchQrCodeInfo(randomKeys);
      if (result.data) {
        setInterval(null);
        sessionStorage.setItem('login', JSON.stringify(result.data));
        switch (history.action) {
          case 'POP':
            history.replace('/mine');
            break;

          case 'PUSH':
            history.goBack();
            break;

          default:
            break;
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useInterval(
    () => {
      fetchData();
    },
    interval,
    { immediate: true },
  );

  useEffect(() => {
    const loginStr = sessionStorage.getItem('login');

    if (loginStr) {
      history.replace('/mine');
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.title}>请用UMedia App扫码登录</div>
      <div className={styles.qrcode}>
        <QRCode
          id="qrcode"
          value={`UMedia://login?key=${randomKeys}`}
          renderAs={'svg'}
          size={240}
          level={'H'}
          imageSettings={{
            src: UMedia,
            height: 56,
            width: 56,
            excavate: true,
          }}
        />
      </div>
    </div>
  );
};

export default Login;
