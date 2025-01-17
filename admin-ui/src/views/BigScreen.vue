<template>
  <div class="big-screen" ref="bigScreen">
    <div class="header-container">
      <h1>年会节目直播大屏</h1>
      <el-button 
        size="small" 
        type="primary" 
        @click="toggleFullscreen"
        class="fullscreen-btn"
      >
        {{ isFullscreen ? '退出全屏' : '全屏显示' }}
      </el-button>
    </div>
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
          <video
            ref="videoPlayer"
            class="video-player"
            :class="{ 'full-height': !showPlaylist }"
            :src="currentVideo"
            controls
            @ended="handleVideoEnd"
          ></video>
          
          <div class="gift-container" v-show="currentVideo">
            <transition name="gift">
              <div class="gift-box" v-if="showGift">
                <div class="gift-info">
                  <div class="gift-avatar">
                    <img :src="giftData.senderAvatar || '/default-avatar.png'" alt="avatar">
                  </div>
                  <div class="gift-content">
                    <span class="sender">{{ giftData.realName }}</span>
                    <div class="gift-text">
                      送出了 
                      <span class="gift-icon">🚀</span>
                      <span class="gift-count">×{{ giftData.giftCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <div class="video-controls" v-show="showPlaylist">
            <div class="playlist-header">
              <h3>播放列表</h3>
              <div>
                <input
                  type="file"
                  ref="fileInput"
                  accept="video/*"
                  multiple
                  @change="handleFileSelect"
                  style="display: none"
                >
                <el-button size="small" @click="$refs.fileInput.click()">
                  添加视频
                </el-button>
              </div>
            </div>
            
            <div class="playlist">
              <div
                v-for="(video, index) in playlist"
                :key="index"
                class="playlist-item"
                :class="{ active: currentVideoIndex === index }"
                @click="playVideo(index)"
              >
                <span class="video-name">{{ video.name }}</span>
                <el-button
                  size="small"
                  type="danger"
                  @click.stop="removeVideo(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
            
            <div class="video-controls-buttons">
              <el-button @click="playPrevious" :disabled="!hasPrevious">
                上一个
              </el-button>
              <el-button @click="toggleLoop" :type="isLooping ? 'success' : 'default'">
                {{ isLooping ? '循环开' : '循环关' }}
              </el-button>
              <el-button @click="playNext" :disabled="!hasNext">
                下一个
              </el-button>
              <el-button 
                type="warning" 
                @click="testEffects"
                v-if="currentVideo"
              >
                测试特效
              </el-button>
            </div>
          </div>

          <div class="toggle-button">
            <el-button 
              size="small" 
              type="primary" 
              @click="togglePlaylist"
            >
              {{ showPlaylist ? '隐藏列表' : '显示列表' }}
            </el-button>
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
      ],
      
      playlist: [],
      currentVideoIndex: -1,
      isLooping: false,
      showPlaylist: true,
      isFullscreen: false,
      showGift: false,
      giftData: {
        senderAvatar: '',
        realName: '',
        giftCount: 0
      },
      ws: null,
      processedMessageIds: new Set(),
      wsReconnectTimer: null,
      isAnimating: false,
      animationQueue: [],
      _isMount: false,
      _hideGiftTimer: null,
      _animationInProgress: false,
      _animationQueue: []
    }
  },
  computed: {
    currentVideo() {
      return this.currentVideoIndex >= 0 ? URL.createObjectURL(this.playlist[this.currentVideoIndex].file) : ''
    },
    hasNext() {
      return this.currentVideoIndex < this.playlist.length - 1
    },
    hasPrevious() {
      return this.currentVideoIndex > 0
    }
  },
  methods: {
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      files.forEach(file => {
        this.playlist.push({
          name: file.name,
          file: file
        })
      })
      if (this.currentVideoIndex === -1 && this.playlist.length > 0) {
        this.playVideo(0)
      }
    },
    playVideo(index) {
      this.currentVideoIndex = index
      this.$nextTick(() => {
        if (this.$refs.videoPlayer) {
          this.$refs.videoPlayer.loop = this.isLooping
          this.$refs.videoPlayer.play()
        }
      })
    },
    removeVideo(index) {
      if (index === this.currentVideoIndex) {
        this.$refs.videoPlayer.pause()
        if (this.hasNext) {
          this.playNext()
        } else if (this.hasPrevious) {
          this.playPrevious()
        } else {
          this.currentVideoIndex = -1
        }
      } else if (index < this.currentVideoIndex) {
        this.currentVideoIndex--
      }
      this.playlist.splice(index, 1)
    },
    playNext() {
      if (this.hasNext) {
        this.playVideo(this.currentVideoIndex + 1)
      }
    },
    playPrevious() {
      if (this.hasPrevious) {
        this.playVideo(this.currentVideoIndex - 1)
      }
    },
    toggleLoop() {
      this.isLooping = !this.isLooping
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.loop = this.isLooping
      }
    },
    handleVideoEnd() {
      if (this.isLooping) {
        this.$refs.videoPlayer.play()
      } else if (this.hasNext) {
        this.playNext()
      }
    },
    togglePlaylist() {
      this.showPlaylist = !this.showPlaylist
    },
    toggleFullscreen() {
      const element = this.$refs.bigScreen
      
      if (!this.isFullscreen) {
        if (element.requestFullscreen) {
          element.requestFullscreen()
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen()
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
    },
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement || 
                         !!document.webkitFullscreenElement || 
                         !!document.mozFullScreenElement || 
                         !!document.msFullscreenElement
    },
    addEventListeners() {
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
    },
    removeEventListeners() {
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
    },
    _showGiftEffect(gift) {
      console.log('[BigScreen] _showGiftEffect called with:', gift);
      
      // 如果动画正在进行中，加入队列
      if (this._animationInProgress) {
        console.log('[BigScreen] Animation in progress, queueing gift:', gift);
        this._animationQueue.push(gift);
        return;
      }
      
      // 开始播放动画
      this._playGiftAnimation(gift);
    },
    
    _playGiftAnimation(gift) {
      // 标记动画开始
      this._animationInProgress = true;
      console.log('[BigScreen] Starting animation');
      
      // 取消之前的定时器
      if (this._hideGiftTimer) {
        clearTimeout(this._hideGiftTimer);
        this._hideGiftTimer = null;
      }
      
      // 设置礼物数据
      this.giftData = gift;
      this.showGift = true;
      
      // 设置动画结束定时器
      this._hideGiftTimer = setTimeout(() => {
        console.log('[BigScreen] Animation ending');
        this.showGift = false;
        this._animationInProgress = false;
        this._hideGiftTimer = null;
        
        // 检查队列中是否有下一个动画
        this.$nextTick(() => {
          if (this._animationQueue.length > 0) {
            console.log('[BigScreen] Playing next animation from queue');
            const nextGift = this._animationQueue.shift();
            this._playGiftAnimation(nextGift);
          }
        });
      }, 3000);
    },
    testEffects() {
      this._showGiftEffect({
        senderAvatar: '/default-avatar.png',
        realName: '测试用户',
        giftCount: 1
      });
    },
    initWebSocket() {
      console.log('[BigScreen] Initializing WebSocket');
      
      // 确保只有一个 WebSocket 连接
      this.closeWebSocket();
      
      const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${location.host}/ws/gift`;
      
      console.log('[BigScreen] Creating new WebSocket connection:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[BigScreen] WebSocket connected successfully');
      };
      
      this.ws.onmessage = this.handleWebSocketMessage.bind(this);
    },
    closeWebSocket() {
      if (this.ws) {
        console.log('[BigScreen] Closing existing WebSocket connection');
        this.ws.onclose = null; // 移除重连逻辑
        this.ws.close();
        this.ws = null;
      }
    },
    handleWebSocketMessage(event) {
      try {
        const data = JSON.parse(event.data);
        console.log('[BigScreen] WebSocket message received:', data);
        
        if (data.type === 'gift' && data.giftType === 'rocket') {
          const messageId = `${data.timestamp}-${data.sender}-${data.giftCount}`;
          console.log('[BigScreen] Processing gift message:', messageId);
          
          if (!this.processedMessageIds.has(messageId)) {
            console.log('[BigScreen] New message, showing animation');
            this.processedMessageIds.add(messageId);
            
            // 使用 requestAnimationFrame 确保动画流畅
            requestAnimationFrame(() => {
              this._showGiftEffect({
                senderAvatar: data.senderAvatar,
                realName: data.realName,
                giftCount: data.giftCount
              });
            });
            
            setTimeout(() => {
              console.log('[BigScreen] Removing message from processed cache:', messageId);
              this.processedMessageIds.delete(messageId);
            }, 5000);
          } else {
            console.log('[BigScreen] Duplicate message ignored:', messageId);
          }
        }
      } catch (error) {
        console.error('[BigScreen] Error processing message:', error);
      }
    },
    updateRankList(giftData) {
      const index = this.rankList.findIndex(item => 
        item.programName === giftData.programName
      )
      
      if (index !== -1) {
        this.rankList[index].rocketCount++
        this.rankList.sort((a, b) => b.rocketCount - a.rocketCount)
      } else {
        this.rankList.push({
          programName: giftData.programName,
          rocketCount: 1
        })
      }
    },
    updateGiftRecords(giftData) {
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${
        now.getMinutes().toString().padStart(2, '0')}:${
        now.getSeconds().toString().padStart(2, '0')}`
      
      this.giftRecords.unshift({
        time,
        sender: giftData.sender,
        programName: giftData.programName,
        giftType: '🚀火箭'
      })
      
      if (this.giftRecords.length > 20) {
        this.giftRecords.pop()
      }
    }
  },
  mounted() {
    this._isMount = true;
    console.log('[BigScreen] Component mounted');
    
    // 添加调试信息
    window._debugBigScreen = this;
    
    // 移除之前可能存在的事件监听器
    this.removeEventListeners();
    
    // 添加新的事件监听器
    this.addEventListeners();
    
    this.initWebSocket();
    window.addEventListener('beforeunload', () => {
      if (this.ws) {
        this.ws.close();
      }
    });
  },
  beforeUnmount() {
    this._isMount = false;
    this.removeEventListeners();
    this.closeWebSocket();
    
    // 清理所有定时器和队列
    if (this._hideGiftTimer) {
      clearTimeout(this._hideGiftTimer);
      this._hideGiftTimer = null;
    }
    this._animationQueue = [];
  }
}
</script>

<style scoped>
.big-screen {
  padding: 20px;
  background: #1a1a1a;
  color: #fff;
  min-height: 100vh;
  box-sizing: border-box;
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
  display: flex;
  flex-direction: column;
  position: relative;
}

.video-player {
  width: 100%;
  height: 70%;
  background: #000;
  object-fit: contain;
  transition: height 0.3s ease;
}

.video-player.full-height {
  height: 100%;
}

.toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 4px;
}

.video-controls {
  height: 30%;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s ease;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playlist {
  flex: 1;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.video-name {
  flex: 1;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-controls-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
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

.fullscreen-button {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 4px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}

.fullscreen-btn {
  position: absolute;
  right: 20px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .big-screen {
    padding: 10px;
    height: auto;
    min-height: 100vh;
  }

  h1 {
    font-size: 20px;
    margin-bottom: 15px;
  }

  .screen-content {
    flex-direction: column;
    height: auto;
    gap: 15px;
  }

  .rank-section, .gift-section, .video-section {
    width: 100%;
    min-height: 200px;
    max-height: 300px;
  }

  .video-section {
    order: 2;
    height: 200px;
  }

  .rank-section {
    order: 1;
  }

  .gift-section {
    order: 3;
  }

  .rank-item, .gift-item {
    padding: 8px;
    margin: 3px 0;
  }

  .program-name {
    font-size: 14px;
  }

  .gift-time {
    font-size: 12px;
  }

  .gift-info {
    font-size: 14px;
  }

  h2 {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .video-player {
    height: 60%;
  }

  .video-player.full-height {
    height: 100%;
  }

  .video-controls {
    height: 40%;
  }

  .playlist-item {
    padding: 6px;
  }

  .video-name {
    font-size: 12px;
  }

  .toggle-button {
    bottom: 10px;
    right: 10px;
  }

  .fullscreen-button {
    top: 10px;
    right: 10px;
  }

  .fullscreen-btn {
    right: 10px;
  }
}

/* 针对特别小的屏幕 */
@media screen and (max-width: 320px) {
  .big-screen {
    padding: 5px;
  }

  h1 {
    font-size: 18px;
  }

  .rank-section, .gift-section, .video-section {
    min-height: 180px;
  }
}

/* 添加全屏时的样式 */
.big-screen:fullscreen {
  padding: 20px;
  background: #1a1a1a;
}

/* 兼容 webkit 浏览器 */
.big-screen:-webkit-full-screen {
  padding: 20px;
  background: #1a1a1a;
}

/* 兼容 MS 浏览器 */
.big-screen:-ms-fullscreen {
  padding: 20px;
  background: #1a1a1a;
}

.gift-container {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: v-bind('showPlaylist ? "30%" : "0"');
  pointer-events: none;
  overflow: hidden;
}

.gift-box {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.gift-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.gift-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ffd700;
}

.gift-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gift-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sender {
  color: #ffd700;
  font-weight: bold;
  font-size: 16px;
}

.gift-text {
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.gift-icon {
  font-size: 24px;
}

.gift-count {
  color: #ffd700;
  font-weight: bold;
  font-size: 18px;
}

/* 礼物动画 */
.gift-enter-active {
  animation: giftAnimation 3s ease-out forwards;
}

.gift-leave-active {
  animation: none; /* 移除离开动画 */
}

@keyframes giftAnimation {
  0% {
    bottom: -50px;
    opacity: 0;
    transform: translateX(-50%) scale(0.8);
  }
  15% {
    bottom: 20%;
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  75% {
    bottom: 20%;
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  100% {
    bottom: 20%;
    opacity: 0;
    transform: translateX(-50%) scale(0.8);
  }
}
</style> 