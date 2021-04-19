import { FC, useEffect, useState } from 'react';
import { useCountDown } from 'ahooks';
import dayjs from 'dayjs';

import styles from './index.less';

interface CountDownType {
  saleStartTime: number;
  saleEndTime: number;
}

const CountDown: FC<CountDownType> = (props) => {
  const [countdown, setTargetDate, formattedRes] = useCountDown();
  const { days, hours, minutes, seconds } = formattedRes;
  const [isPublishDate, setIsPublishDate] = useState(false);

  useEffect(() => {
    setIsPublishDate(dayjs(new Date()).valueOf() < props.saleStartTime);
    setTargetDate(
      dayjs(isPublishDate ? props.saleStartTime : props.saleEndTime).valueOf(),
    );
  }, [props.saleEndTime, props.saleStartTime]);

  return (
    <div className={styles.countdown}>
      <div className={styles.tips}>{isPublishDate ? '距开始' : '距结束'}</div>
      <div className={styles.time}>
        {days}:{hours}:{minutes}:{seconds}
      </div>
    </div>
  );
};

export default CountDown;
