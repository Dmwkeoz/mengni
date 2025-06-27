//-------------------------------------代码片段---------------------------------------





//------------主要逻辑，动态层级管理的运用场景-------------

shuffle(cards = this.data.cards) {
        // 洗牌方法
        // cards: 可选参数，默认使用当前卡池
        const visibleCards = cards.filter(card => card.visible); // 筛选出可洗牌的卡片

        // 1. 记录所有可洗牌卡片的当前位置和原始层级
        const oldPositions = visibleCards.map(card => ({
            left: card.left, // 记录原始位置
            top: card.top, // 记录原始位置
            width: card.width, // 记录原始宽高
            height: card.height, // 记录原始宽高
            layer: card.layer, // 记录原始层级
            originalIndex: card.originalIndex // 记录原始层级
        }));

        // 2. 打乱卡片的位置
        const shuffledCards = [...visibleCards];
        for (let i = shuffledCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
        }

        // 3. 将打乱后的卡片位置设置为原始层级
        shuffledCards.forEach((card, idx) => { // 遍历每个打乱后的卡片
            const target = oldPositions[idx]; // 获取对应的原始层级
            // 记录动画后要赋予的属性
            card._futureLeft = target.left; // 目标位置
            card._futureTop = target.top; // 目标位置
            card._futureWidth = target.width; // 目标宽度
            card._futureHeight = target.height; // 目标高度
            card._futureLayer = target.layer; // 目标层级
            card._futureOriginalIndex = target.originalIndex; // 目标原始层级
            if (!card.animating && (card.left !== target.left || card.top !== target.top || card.width !== target.width || card.height !== target.height)) { // 如果卡片没有在动画中，且位置或大小有变化
                this.startCardMoveAnimation(card, target.left, target.top, 1000, target.width, target.height); // 开始动画
                } else {
                card.left = target.left; // 直接设置位置
                card.top = target.top; // 直接设置位置
                card.width = target.width;  // 直接设置宽度
                card.height = target.height; // 直接设置高度
                }
            });

        // 4. 动画结束后，赋予每个卡片新位置的原始层级和坐标
        setTimeout(() => {
            shuffledCards.forEach((card) => { // 遍历每个打乱后的卡片
                // 赋予目标属性
                if (typeof card._futureLayer !== 'undefined') card.layer = card._futureLayer; // 赋予目标层级
                if (typeof card._futureOriginalIndex !== 'undefined') card.originalIndex = card._futureOriginalIndex; // 赋予原始层级
                if (typeof card._futureLeft !== 'undefined') card.left = card._futureLeft; // 赋予目标位置
                if (typeof card._futureTop !== 'undefined') card.top = card._futureTop; // 赋予目标位置
                if (typeof card._futureWidth !== 'undefined') card.width = card._futureWidth; // 赋予目标宽度
                if (typeof card._futureHeight !== 'undefined') card.height = card._futureHeight; // 赋予目标高度
                // 清理临时属性
                delete card._futureLayer; // 记录原始层级
                delete card._futureOriginalIndex; // 记录原始索引
                delete card._futureLeft; // 记录原始位置
                delete card._futureTop; // 记录原始位置
                delete card._futureWidth; // 记录原始宽度
                delete card._futureHeight; // 记录原始高度
            });

            this.initializeBlocking();
            this.game.render();
        }, 1010); // 确保动画结束后再赋值
        return cards;
    }







    //----------------------------------可选，动画函数，渲染，遮挡关系--------------------------------------

    
    //---------------公共卡片移动动画启动函数-----------------
    startCardMoveAnimation(card, toLeft, toTop, duration = 200, toWidth = 55, toHeight = 55, onComplete) {
    // 使用 easeOut 动画（先快后慢）
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 2);
    }
    card._from = { left: card.left, top: card.top, width: card.width, height: card.height };
    card._to = { left: toLeft, top: toTop, width: toWidth, height: toHeight };
    card._animationStart = Date.now();
    card._animationDuration = duration;
    card.animating = true;
    card._easeFunc = easeOut; // 标记动画曲线

    // === 新增：动画完成回调 ===
    card._moveAnimOnComplete = onComplete || null;
    // 不再调用 this.render()，render 会自动递归刷新
  }
  


  //------------------渲染-----------------------

  render() {
    // 防止递归重复渲染
    if (this._rafing) return;
    this._rafing = true;

    console.log('渲染游戏界面');

    // --- 渲染卡片池 ---
    // 1. 先分组：正在平移动画的卡片和其他卡片
    this.main.data.cards.sort((a, b) => (a.layer || 0) - (b.layer || 0)); // 按 layer 升序排序，确保层级正确
    let brightnessAnimating = false; // 亮度动画标志
    let cardMoving = false; // 卡片移动动画标志
    const animatingCards = []; // 正在动画的卡片
    const staticCards = []; // 静态卡片（不在动画中的卡片）
    this.main.data.cards.forEach(card => { // 遍历所有卡片
      if (!card.visible && !card.isBeingRemoved) return; // 如果卡片不可见且未在消除动画中，跳过渲染
      if (card.animating) { // 如果卡片正在动画中
        animatingCards.push(card); // 将卡片添加到正在动画的卡片列表
      } else {
        staticCards.push(card); // 将卡片添加到静态卡片列表
      }
    });

    // 2. 先渲染静态卡片（正常层级）
    staticCards.forEach((card) => {
      // 统一卡片平移动画处理
      let drawLeft = card.left; // 卡片左上角 x 坐标
      let drawTop = card.top; // 卡片左上角 y 坐标
      let drawWidth = card.width; // 卡片宽度
      let drawHeight = card.height; // 卡片高度
      if (card.animating && card._animationStart !== null) { // 如果卡片正在动画中
        const now = Date.now(); // 获取当前时间
        let progress = Math.min((now - card._animationStart) / (card._animationDuration || 200), 1); // 计算动画进度，最大值为 1
        if (typeof card._easeFunc === 'function') { // 如果有自定义的缓动函数
          progress = card._easeFunc(progress); // 使用缓动函数计算进度
        }
        drawLeft = card._from.left + (card._to.left - card._from.left) * progress; // 计算动画后的左上角 x 坐标
        drawTop = card._from.top + (card._to.top - card._from.top) * progress; // 计算动画后的左上角 y 坐标
        drawWidth = card._from.width + (card._to.width - card._from.width) * progress; // 计算动画后的宽度
        drawHeight = card._from.height + (card._to.height - card._from.height) * progress; // 计算动画后的高度
        if (progress >= 1) { // 如果动画进度达到 1
          card.animating = false; // 标记卡片动画结束
          card.left = card._to.left; // 更新卡片位置
          card.top = card._to.top; // 更新卡片位置
          card.width = card._to.width; // 更新卡片宽度
          card.height = card._to.height; // 更新卡片高度
          // === 洗牌动画结束后，layer赋值 ===
          if (typeof card.targetLayer !== "undefined") { // 如果有目标层级
            card.layer = card.targetLayer; // 恢复卡片的层级
            delete card.targetLayer; // 删除目标层级属性
          }
        } else {
          cardMoving = true; // 只要有卡片在平移动画中，递归刷新
        }
      }

      // 恢复亮度动画相关逻辑
      // 初始化动画相关字段
      if (card.brightness === undefined) card.brightness = card.isBlocked ? 0.5 : 1; // 初始化亮度
      if (card._transitionTime === undefined) card._transitionTime = null; // 初始化过渡时间
      if (card.wasBlocked === undefined) card.wasBlocked = card.isBlocked; // 初始化遮挡状态

      // 检测遮挡状态变化，记录动画起始时间
      if (card.wasBlocked && !card.isBlocked) { // 如果之前被遮挡，现在不被遮挡
        card._transitionTime = Date.now(); // 记录过渡开始时间
      }
      card.wasBlocked = card.isBlocked; // 更新遮挡状态

      // 动态计算亮度
      // 动画期间禁止亮度更新 
      if (this.main._blockBrightnessUpdate) {
        card.brightness = card.isBlocked ? 0.5 : 1; // 如果被遮挡，亮度为 0.5，否则为 1
        card._transitionTime = null; // 禁止过渡时间更新
      } else if (card.isBlocked) { // 如果卡片被遮挡
        card.brightness = 0.5; // 被遮挡时亮度为 0.5
        card._transitionTime = null; // 禁止过渡时间更新
      } else if (card._transitionTime !== null) { // 如果有过渡时间
        const t = (Date.now() - card._transitionTime) / 300; // 计算过渡时间比例，300ms 为过渡持续时间
        if (t >= 1) { // 如果过渡时间超过 1
          card.brightness = 1; // 恢复亮度为 1
          card._transitionTime = null; // 清除过渡时间
        } else {
          card.brightness = 0.5 + t * 0.5; // 计算当前亮度，0.5 + t * 0.5，t 在 [0, 1] 范围内
          brightnessAnimating = true; // 标记有亮度动画正在进行
        }
      } else {
        card.brightness = 1; // 如果没有过渡时间，亮度保持为 1
      }

      const img = this.assets[card.pattern] || this.assets.card; // 获取卡片图像，如果没有指定图案则使用默认卡片图像

      // --- 替换 drawImage 部分，包裹缩放 ---
      this.ctx.save(); // 保存当前状态
      this.ctx.translate(drawLeft + drawWidth / 2, drawTop + drawHeight / 2); // 将坐标系原点移动到卡片中心
      // 动态亮度渲染
      let filterSupported = false; // 检查浏览器是否支持 filter 属性
      try { // 尝试设置 filter 属性
        if (typeof this.ctx.filter !== "undefined") { // 检查 filter 属性是否可用
          filterSupported = true; // 如果可用，标记为支持
        }
      } catch (e) {} // 捕获异常，避免浏览器不支持 filter 时导致错误
      if (filterSupported) { // 如果支持 filter 属性
        this.ctx.filter = `brightness(${card.brightness})`; // 设置亮度滤镜
        this.ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); // 绘制卡片图像，中心对齐
        this.ctx.filter = "none"; // 重置滤镜
      } else { // 如果不支持 filter 属性
        this.ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); // 绘制卡片图像，中心对齐
        if (card.brightness < 1) { // 如果亮度小于 1
          this.ctx.globalAlpha = 1 - card.brightness; // 设置透明度为 1 减去亮度
          this.ctx.fillStyle = "#000"; // 设置填充颜色为黑色
          this.ctx.fillRect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); // 绘制黑色矩形覆盖卡片
        }
      }
      this.ctx.restore(); // 恢复之前保存的状态
    });

    // 3. 后渲染正在动画的卡片（始终在最上层）
    animatingCards.forEach((card) => { // 遍历正在动画的卡片
      // 统一卡片平移动画处理
      let drawLeft = card.left; // 卡片左上角 x 坐标
      let drawTop = card.top; // 卡片左上角 y 坐标
      let drawWidth = card.width; // 卡片宽度
      let drawHeight = card.height; // 卡片高度
      if (card.animating && card._animationStart !== null) { // 如果卡片正在动画中
        const now = Date.now(); // 获取当前时间
        let progress = Math.min((now - card._animationStart) / (card._animationDuration || 200), 1); // 计算动画进度，最大值为 1
        if (typeof card._easeFunc === 'function') { // 如果有自定义的缓动函数
          progress = card._easeFunc(progress); // 使用缓动函数计算进度
        }
        drawLeft = card._from.left + (card._to.left - card._from.left) * progress; // 计算动画后的左上角 x 坐标
        drawTop = card._from.top + (card._to.top - card._from.top) * progress; // 计算动画后的左上角 y 坐标
        drawWidth = card._from.width + (card._to.width - card._from.width) * progress; // 计算动画后的宽度
        drawHeight = card._from.height + (card._to.height - card._from.height) * progress; // 计算动画后的高度
        if (progress >= 1) { // 如果动画进度达到 1
          card.animating = false; // 标记卡片动画结束
          card.left = card._to.left; // 更新卡片位置
          card.top = card._to.top; // 更新卡片位置
          card.width = card._to.width; // 更新卡片宽度
          card.height = card._to.height; // 更新卡片高度
          // === 洗牌动画结束后，layer赋值 ===
          if (typeof card.targetLayer !== "undefined") { // 如果有目标层级
            card.layer = card.targetLayer; // 恢复卡片的层级
            delete card.targetLayer; // 删除目标层级属性
          }
          // === 新增：动画完成回调 ===
          if (typeof card._moveAnimOnComplete === 'function') { // 如果有动画完成回调函数
            card._moveAnimOnComplete(); // 执行回调函数
            card._moveAnimOnComplete = null; // 清除回调函数，避免重复调用
          }
        } else {
          cardMoving = true; // 只要有卡片在平移动画中，递归刷新
        }
      }

      if (this.game && typeof this.game.render === 'function') { 
            this.game.render();
      }

      // 恢复亮度动画相关逻辑
      // 初始化动画相关字段
      if (card.brightness === undefined) card.brightness = card.isBlocked ? 0.5 : 1;
      if (card._transitionTime === undefined) card._transitionTime = null;
      if (card.wasBlocked === undefined) card.wasBlocked = card.isBlocked;

      // 检测遮挡状态变化，记录动画起始时间
      if (card.wasBlocked && !card.isBlocked) {
        card._transitionTime = Date.now();
      }
      card.wasBlocked = card.isBlocked;

      // 动态计算亮度
        if (card.isBlocked) {
        card.brightness = 0.5;
        card._transitionTime = null;
      } else if (card._transitionTime !== null) {
        const t = (Date.now() - card._transitionTime) / 300;
        if (t >= 1) {
          card.brightness = 1;
          card._transitionTime = null;
        } else {
          card.brightness = 0.5 + t * 0.5;
          brightnessAnimating = true;
        }
      } else {
        card.brightness = 1;
      }

      const img = this.assets[card.pattern] || this.assets.card;

      // --- 替换 drawImage 部分，包裹缩放 ---
      this.ctx.save();
      this.ctx.translate(drawLeft + drawWidth / 2, drawTop + drawHeight / 2);
      // 动态亮度渲染
      let filterSupported = false;
      try { // 尝试设置 filter 属性
        if (typeof this.ctx.filter !== "undefined") {
          filterSupported = true;
        }
      } catch (e) {}
      if (filterSupported) {
        this.ctx.filter = `brightness(${card.brightness})`;
        this.ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        this.ctx.filter = "none";
      } else {
        this.ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        if (card.brightness < 1) {
          this.ctx.globalAlpha = 1 - card.brightness;
          this.ctx.fillStyle = "#000";
          this.ctx.fillRect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        }
      }
      this.ctx.restore();
    });

    // 只要有卡片在亮度动画或移动动画中，强制下一帧刷新
    if (brightnessAnimating || cardMoving) {
      requestAnimationFrame(() => {
        this._rafing = false;
        this.render();
      });
    } else {
      this._rafing = false;
    }
  }



//--------------------遮挡关系-----------------------

    initializeBlocking() {
        // === 动画期间禁止遮挡关系更新 ===
        if (this._blockBlockingUpdate) return;
        // 卡片的遮挡关系
        const cards = this.data.cards;
        const stackIds = this.data.stack.map(item => item.id);
        // === 可自定义重叠检测边缘宽度 ===
        const overlapMargin = 5; // 例如5像素边缘不计入重叠，可自行调整

        // === 新增：同一layer内按top、left排序，分配更高的layer，避免左/上盖住右/下 ===
        // 只处理非stack、可见卡片
        const nonStackCards = cards.filter(card => card.visible && !stackIds.includes(card.id));
        // 按layer分组
        const layerGroups = {};
        nonStackCards.forEach(card => {
            if (!layerGroups[card.layer]) layerGroups[card.layer] = [];
            layerGroups[card.layer].push(card);
        });
        Object.values(layerGroups).forEach(group => {
            if (this._BlockingUpdateLayer) return;
            group.sort((a, b) => {
                if (a.top !== b.top) return a.top - b.top;
                return a.left - b.left;
            });
            group.forEach((card, idx) => {
                // 让同一层内下/右的layer更高
                card.layer = Number(card.layer) + idx * 0.001;
            });
        });

        for (let i = 0; i < cards.length; i++) {
            const cardA = cards[i];
            if (!cardA.visible || stackIds.includes(cardA.id)) {
                cardA.blockedBy = [];
                cardA.isBlocked = false;
                continue;
            }
            cardA.blockedBy = [];
            for (let j = 0; j < cards.length; j++) {
                const cardB = cards[j];
                if (
                    cardB.id !== cardA.id &&
                    cardB.visible &&
                    !stackIds.includes(cardB.id) &&
                    cardB.layer > cardA.layer &&
                    this.isOverlapping(cardA, cardB, overlapMargin)
                ) {
                    cardA.blockedBy.push(cardB.id);
                }
            }
            cardA.isBlocked = cardA.blockedBy.length > 0;
        }
        this.data.cards = cards;
    }




//---------------------检查两个卡片是否重叠---------------------

    isOverlapping(a, b, margin = 0) {
        if (this._blockBlockingUpdate) return;
        // 检查两个卡片是否重叠，可自定义边缘检测范围
        // margin: 边缘忽略像素（正数时缩小判定区域，负数时扩大）
        // 例如 margin=5 时，只有卡片中心区域重叠才算重叠，边缘5像素不计入
        return !(
            (a.left + margin + a.width - 2 * margin) < b.left + margin ||
            (b.left + margin + b.width - 2 * margin) < a.left + margin ||
            (a.top + margin + a.height - 2 * margin) < b.top + margin ||
            (b.top + margin + b.height - 2 * margin) < a.top + margin
        );
    }