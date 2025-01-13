<template>
  <div class="big-screen">
    <h1>年会节目直播大屏</h1>
    <div class="screen-content">
      <div class="rank-section">
        <h2>火箭排行榜</h2>
        <div class="rank-list">
          <div v-for="(item, index) in rankList" :key="index" class="rank-item">
            <span class="rank-num">{{ index + 1 }}</span>
            <span class="program-name">{{ item.programName }}</span>
            <span class="rocket-count">🚀 × {{ item.rocketCount }}</span>
          </div>
        </div>
      </div>

      <div class="video-section">
        <div class="video-container">
          <div class="video-placeholder">
            视频播放区域
          </div>
        </div>
      </div>

      <div class="gift-section">
        <h2>实时送礼记录</h2>
        <div class="gift-list">
          <div v-for="(record, index) in giftRecords" :key="index" class="gift-item">
            <div class="gift-time">{{ record.time }}</div>
            <div class="gift-info">
              <span class="gift-sender">{{ record.sender }}</span>
              赠送给
              <span class="gift-program">{{ record.programName }}</span>
              <span class="gift-type">{{ record.giftType }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BigScreen',
  data() {
    return {
      rankList: [
        { programName: '舞蹈《青花瓷》', rocketCount: 88 },
        { programName: '歌曲《奔跑》', rocketCount: 66 },
        { programName: '相声《快乐生活》', rocketCount: 55 },
        { programName: '魔术《魔法时刻》', rocketCount: 44 },
        { programName: '小品《欢乐时光》', rocketCount: 33 },
      ],
      giftRecords: [
        { time: '20:15:30', sender: '张三', programName: '舞蹈《青花瓷》', giftType: '🚀火箭' },
        { time: '20:14:25', sender: '李四', programName: '歌曲《奔跑》', giftType: '🚀火箭' },
        { time: '20:13:18', sender: '王五', programName: '相声《快乐生活》', giftType: '🚀火箭' },
        { time: '20:12:05', sender: '赵六', programName: '魔术《魔法时刻》', giftType: '🚀火箭' },
        { time: '20:11:55', sender: '孙七', programName: '小品《欢乐时光》', giftType: '🚀火箭' },
      ]
    }
  }
}
</script>

<style scoped>
.big-screen {
  padding: 20px;
  background: #1a1a1a;
  color: #fff;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.screen-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 100px);
}

.rank-section, .gift-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.video-section {
  flex: 2;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container {
  width: 100%;
  height: 100%;
}

.rank-list, .gift-list {
  flex: 1;
  overflow-y: auto;
}

h2 {
  margin-bottom: 15px;
  text-align: center;
}

.rank-item {
  padding: 10px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.rank-num {
  width: 30px;
  font-weight: bold;
  color: #ffd700;
}

.program-name {
  flex: 1;
}

.rocket-count {
  color: #ff4d4f;
}

.gift-item {
  padding: 10px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.gift-time {
  color: #888;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.gift-info {
  line-height: 1.5;
}

.gift-sender {
  color: #ffd700;
}

.gift-program {
  color: #1890ff;
}

.gift-type {
  color: #ff4d4f;
  margin-left: 5px;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #666;
  background: #111;
  border-radius: 8px;
}
</style> 