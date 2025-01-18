<template>
  <div class="big-screen" ref="screenRef">
    <!-- 视频播放器容器 -->
    <div class="video-container">
      <video
        ref="videoRef"
        class="video-player"
        :src="currentVideo"
        @ended="handleVideoEnd"
        @timeupdate="handleTimeUpdate"
        @click="togglePlay"
        @pause="isPaused = true"
        @play="isPaused = false"
        controls
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        :disableRemotePlayback="true"
        :controlslist="'nodownload nofullscreen noremoteplayback'"
      >
        您的浏览器不支持 video 标签
      </video>
      
      <!-- 自定义控制栏 -->
      <div 
        class="video-controls-wrapper"
        v-show="showControls || !isFullscreen"
        @mouseenter="handleControlsEnter"
        @mouseleave="handleControlsLeave"
      >
        <!-- 进度条 -->
        <div class="progress-bar">
          <el-slider
            v-model="progress"
            :min="0"
            :max="100"
            :format-tooltip="value => formatTime(duration * value / 100)"
            @input="handleProgressDrag"
          />
        </div>

        <div class="controls-panel">
          <div class="left-controls">
            <!-- 播放/暂停 -->
            <el-button class="control-btn" circle @click="togglePlay">
              <i :class="isPaused ? 'el-icon-video-play' : 'el-icon-video-pause'"></i>
            </el-button>

            <!-- 上一个/下一个 -->
            <el-button 
              class="control-btn" 
              circle 
              @click="playPrevious"
              :disabled="!hasPrevious"
            >
              <i class="el-icon-arrow-left"></i>
            </el-button>
            <el-button 
              class="control-btn" 
              circle 
              @click="playNext"
              :disabled="!hasNext"
            >
              <i class="el-icon-arrow-right"></i>
            </el-button>

            <!-- 循环播放 -->
            <el-button 
              class="control-btn" 
              circle 
              @click="toggleLoop"
              :type="isLooping ? 'primary' : ''"
            >
              <i class="el-icon-refresh"></i>
            </el-button>

            <!-- 音量控制 -->
            <div class="volume-control">
              <el-button class="control-btn" circle @click="toggleMute">
                <i :class="volumeIcon"></i>
              </el-button>
              <el-slider 
                v-model="volume" 
                :min="0" 
                :max="100"
                @input="handleVolumeChange"
                class="volume-slider"
              />
            </div>

            <!-- 时间显示 -->
            <span class="time-display">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>
          </div>

          <div class="right-controls">
            <!-- 播放列表按钮 -->
            <el-button 
              class="control-btn" 
              circle 
              @click="togglePlaylist"
              :type="showPlaylist ? 'primary' : ''"
            >
              <i class="el-icon-menu"></i>
            </el-button>

            <!-- 全屏按钮 -->
            <el-button 
              class="control-btn" 
              circle 
              @click="toggleFullscreen"
            >
              <i :class="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 播放列表抽屉 -->
      <el-drawer
        v-model="showPlaylist"
        title="播放列表"
        :direction="isFullscreen ? 'rtl' : 'rtl'"
        :size="300"
        :with-header="true"
        custom-class="playlist-drawer"
        :modal="false"
        :show-close="true"
      >
        <div class="playlist-header">
          <el-button 
            type="primary"
            size="small"
            @click="$refs.fileInput.click()"
          >
            添加视频
          </el-button>
          <input
            ref="fileInput"
            type="file"
            accept="video/*"
            multiple
            style="display: none"
            @change="handleFileSelect"
          >
        </div>
        
        <div class="playlist-content">
          <div 
            v-for="(item, index) in playlist" 
            :key="index"
            class="playlist-item"
            :class="{ active: index === currentVideoIndex }"
            @click="playVideo(index)"
          >
            <span class="item-index">{{ index + 1 }}</span>
            <span class="item-name">{{ item.name }}</span>
            <el-button 
              class="delete-btn"
              size="small" 
              type="danger"
              circle
              @click.stop="removeVideo(index)"
            >
              <i class="el-icon-delete"></i>
            </el-button>
          </div>
        </div>
      </el-drawer>

      <!-- 礼物动画容器 -->
      <div class="gift-container" :class="{ 'fullscreen': isFullscreen }">
        <transition name="gift">
          <div v-if="showGift" class="gift-box">
            <div class="gift-info">
              <div class="gift-avatar">
                <img :src="giftData.senderAvatar || '/default-avatar.png'" alt="avatar" />
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
      wsReconnectTimer: null,
      wsReconnectAttempts: 0,
      wsMaxReconnectAttempts: 5,
      processedMessageIds: new Set(),
      isAnimating: false,
      animationQueue: [],
      _isMount: false,
      _hideGiftTimer: null,
      _animationInProgress: false,
      _animationQueue: [],
      _animationTimer: null,
      _transitionTimer: null,
      isPaused: true,
      isMuted: false,
      volume: 100,
      currentTime: 0,
      duration: 0,
      progress: 0,
      showControls: true,
      controlsTimer: null,
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
    },
    volumeIcon() {
      if (this.isMuted || this.volume === 0) {
        return 'el-icon-turn-off-microphone';
      } else if (this.volume < 50) {
        return 'el-icon-microphone';
      } else {
        return 'el-icon-mic';
      }
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
        if (this.$refs.videoRef) {
          this.$refs.videoRef.loop = this.isLooping
          this.$refs.videoRef.play()
        }
      })
    },
    removeVideo(index) {
      if (index === this.currentVideoIndex) {
        this.$refs.videoRef.pause()
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
      if (this.$refs.videoRef) {
        this.$refs.videoRef.loop = this.isLooping
      }
    },
    handleVideoEnd() {
      if (this.isLooping) {
        this.$refs.videoRef.play()
      } else if (this.hasNext) {
        this.playNext()
      }
    },
    togglePlaylist() {
      this.showPlaylist = !this.showPlaylist
    },
    toggleFullscreen() {
      const element = this.$refs.screenRef;
      
      if (!document.fullscreenElement) {
        element.requestFullscreen().then(() => {
          this.isFullscreen = true;
        }).catch(err => {
          console.error('全屏失败:', err);
        });
      } else {
        document.exitFullscreen().then(() => {
          this.isFullscreen = false;
        }).catch(err => {
          console.error('退出全屏失败:', err);
        });
      }
    },
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
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
      
      // 将礼物添加到队列
      this._animationQueue.push(gift);
      console.log('[BigScreen] Animation queue length:', this._animationQueue.length);
      
      // 如果没有动画在播放，开始播放
      if (!this._animationInProgress) {
        this._playNextAnimation();
      }
    },
    
    _playNextAnimation() {
      if (this._animationQueue.length === 0 || this._animationInProgress) {
        console.log('[BigScreen] No animations to play or animation in progress');
        return;
      }
      
      const gift = this._animationQueue.shift();
      console.log('[BigScreen] Playing animation for gift:', gift);
      
      this._animationInProgress = true;
      
      // 先重置状态
      this.showGift = false;
      this.giftData = gift;
      
      // 使用 nextTick 确保 DOM 更新
      this.$nextTick(() => {
        // 短暂延迟后显示动画
        this._transitionTimer = setTimeout(() => {
          this.showGift = true;
          
          // 设置动画结束定时器
          this._animationTimer = setTimeout(() => {
            console.log('[BigScreen] Animation completed');
            this.showGift = false;
            
            // 等待淡出动画完成
            setTimeout(() => {
              this._animationInProgress = false;
              
              // 检查是否有下一个动画
              if (this._animationQueue.length > 0) {
                console.log('[BigScreen] Playing next animation from queue');
                this._playNextAnimation();
              }
            }, 300); // 等待淡出动画完成
            
          }, 2500); // 动画显示时间
        }, 100); // 短暂延迟以确保状态重置
      });
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
        this.wsReconnectAttempts = 0; // 重置重连次数
      };
      
      this.ws.onclose = () => {
        console.log('[BigScreen] WebSocket connection closed');
        if (this._isMount && this.wsReconnectAttempts < this.wsMaxReconnectAttempts) {
          console.log('[BigScreen] Attempting to reconnect...');
          this.wsReconnectAttempts++;
          this.wsReconnectTimer = setTimeout(() => {
            console.log('[BigScreen] Reconnecting... Attempt:', this.wsReconnectAttempts);
            this.initWebSocket();
          }, 3000);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[BigScreen] WebSocket error:', error);
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
      
      if (this.wsReconnectTimer) {
        clearTimeout(this.wsReconnectTimer);
        this.wsReconnectTimer = null;
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
            
            this._showGiftEffect({
              senderAvatar: data.senderAvatar,
              realName: data.realName,
              giftCount: data.giftCount
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
    },
    handleVisibilityChange() {
      if (document.hidden) {
        console.log('[BigScreen] Page hidden, closing WebSocket');
        this.closeWebSocket();
      } else {
        console.log('[BigScreen] Page visible, reconnecting WebSocket');
        this.initWebSocket();
      }
    },
    togglePlay() {
      const video = this.$refs.videoRef;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    },
    handleTimeUpdate() {
      const video = this.$refs.videoRef;
      this.currentTime = video.currentTime;
      this.duration = video.duration;
      this.progress = (video.currentTime / video.duration) * 100;
    },
    handleProgressDrag(value) {
      const video = this.$refs.videoRef;
      if (video) {
        video.currentTime = (value / 100) * video.duration;
      }
    },
    toggleMute() {
      const video = this.$refs.videoRef;
      video.muted = !video.muted;
      this.isMuted = video.muted;
    },
    handleVolumeChange(value) {
      const video = this.$refs.videoRef;
      video.volume = value / 100;
      if (value === 0) {
        this.isMuted = true;
      } else {
        this.isMuted = false;
      }
    },
    formatTime(seconds) {
      if (!seconds) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    handleControlsEnter() {
      if (this.controlsTimer) {
        clearTimeout(this.controlsTimer);
        this.controlsTimer = null;
      }
      this.showControls = true;
    },
    handleControlsLeave() {
      if (this.isFullscreen) {
        this.controlsTimer = setTimeout(() => {
          this.showControls = false;
        }, 3000);
      }
    },
    handleMouseMove() {
      if (this.isFullscreen) {
        this.showControls = true;
        this.handleControlsLeave();
      }
    },
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
    
    // 初始化 WebSocket
    this.initWebSocket();
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    document.addEventListener('mousemove', this.handleMouseMove);
  },
  beforeUnmount() {
    this._isMount = false;
    this.removeEventListeners();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.closeWebSocket();
    
    // 清理所有定时器和队列
    if (this._animationTimer) {
      clearTimeout(this._animationTimer);
      this._animationTimer = null;
    }
    if (this._transitionTimer) {
      clearTimeout(this._transitionTimer);
      this._transitionTimer = null;
    }
    this._animationQueue = [];
    this._animationInProgress = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    if (this.controlsTimer) {
      clearTimeout(this.controlsTimer);
    }
  }
}
</script>

<style scoped>
.big-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 隐藏原生全屏按钮 */
.video-player::-webkit-media-controls-fullscreen-button {
  display: none !important;
}

/* 视频控制面板样式 */
.video-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}

.playlist-controls {
  display: flex;
  gap: 10px;
}

.fullscreen-control {
  margin-left: auto;
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
  position: fixed;
  left: 50%;
  bottom: 20%;
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
  animation: giftIn 0.5s ease-out;
}

.gift-leave-active {
  animation: giftOut 0.3s ease-in;
}

@keyframes giftIn {
  0% {
    transform: translateX(-50%) translateY(100px) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes giftOut {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-100px) scale(0.8);
    opacity: 0;
  }
}

/* 确保控制面板在全屏时也能显示 */
:fullscreen .video-controls {
  position: fixed;
}

:-webkit-full-screen .video-controls {
  position: fixed;
}

:-moz-full-screen .video-controls {
  position: fixed;
}

:-ms-fullscreen .video-controls {
  position: fixed;
}

/* 播放列表面板样式 */
.playlist-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 3;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.playlist-header h3 {
  margin: 0;
}

.playlist-content {
  flex: 1;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.item-name {
  flex: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 确保播放列表在全屏时也能正确显示 */
:fullscreen .playlist-panel {
  position: fixed;
}

:-webkit-full-screen .playlist-panel {
  position: fixed;
}

:-moz-full-screen .playlist-panel {
  position: fixed;
}

:-ms-fullscreen .playlist-panel {
  position: fixed;
}

.custom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px;
  transition: opacity 0.3s;
  z-index: 2;
}

.controls-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-controls, .right-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-slider {
  width: 100px;
}

.progress-bar {
  position: relative;
  height: 4px;
  margin-bottom: 10px;
  cursor: pointer;
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
}

.progress-current {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #409EFF;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 0.1s linear;
}

.time-display {
  color: #fff;
  font-size: 14px;
  margin-left: 10px;
}

/* 全屏时的控制栏样式 */
:fullscreen .custom-controls {
  position: fixed;
}

:-webkit-full-screen .custom-controls {
  position: fixed;
}

:-moz-full-screen .custom-controls {
  position: fixed;
}

:-ms-fullscreen .custom-controls {
  position: fixed;
}

.video-controls-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  transition: opacity 0.3s;
  z-index: 100;
}

.controls-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.left-controls, .right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #fff;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 150px;
}

.volume-slider {
  width: 80px;
}

.time-display {
  color: #fff;
  font-size: 13px;
  margin: 0 10px;
}

/* 播放列表抽屉样式 */
.playlist-drawer {
  background: rgba(0, 0, 0, 0.9) !important;
  color: #fff;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.playlist-header {
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.playlist-content {
  padding: 10px;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.item-index {
  width: 24px;
  color: #999;
}

.item-name {
  flex: 1;
  margin: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.playlist-item:hover .delete-btn {
  opacity: 1;
}

/* 进度条样式优化 */
.progress-bar {
  padding: 10px 0;
}

.progress-bar :deep(.el-slider__runway) {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.progress-bar :deep(.el-slider__bar) {
  height: 4px;
  background: #409EFF;
}

.progress-bar :deep(.el-slider__button) {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  background: #409EFF;
}

/* 全屏样式 */
:fullscreen .video-controls-wrapper {
  position: fixed;
}

:-webkit-full-screen .video-controls-wrapper {
  position: fixed;
}

:-moz-full-screen .video-controls-wrapper {
  position: fixed;
}

:-ms-fullscreen .video-controls-wrapper {
  position: fixed;
}
</style> 