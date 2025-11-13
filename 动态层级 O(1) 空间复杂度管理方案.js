//-------------------------------------代码片段---------------------------------------




// Dynamic Layer Consistency（DLC）仅用 52 行代码解决动态层级一致性问题
// MIT License
// Copyright (c) 2025 Dmwkeoz
// https://github.com/Dmwkeoz/mengni/blob/main/%E5%8A%A8%E6%80%81%E5%B1%82%E7%BA%A7%20O(1)%20%E7%A9%BA%E9%97%B4%E5%A4%8D%E6%9D%82%E5%BA%A6%E7%AE%A1%E7%90%86%E6%96%B9%E6%A1%88.js
//------------主要逻辑，动态层级管理的运用场景-------------

//以洗牌举例
shuffle(cards = this.data.cards) {
        // 洗牌方法
        // cards: 可选参数，默认使用当前卡池
        const visibleCards = cards.filter(card => card.visible); // 筛选出可洗牌的卡片

        // 1. 记录所有可洗牌卡片的当前位置和原始层级
        const oldPositions = visibleCards.map(card => ({
            left: card.left, // 记录位置
            top: card.top, // 记录位置
            width: card.width, // 记录宽高
            height: card.height, // 记录宽高
            layer: card.layer, // 记录普通层级
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
            card._futureLayer = target.layer; // 目标普通层级
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
                if (typeof card._futureLayer !== 'undefined') card.layer = card._futureLayer; // 赋予普通层级
                if (typeof card._futureOriginalIndex !== 'undefined') card.originalIndex = card._futureOriginalIndex; // 赋予原始层级
                if (typeof card._futureLeft !== 'undefined') card.left = card._futureLeft; // 赋予目标位置
                if (typeof card._futureTop !== 'undefined') card.top = card._futureTop; // 赋予目标位置
                if (typeof card._futureWidth !== 'undefined') card.width = card._futureWidth; // 赋予目标宽度
                if (typeof card._futureHeight !== 'undefined') card.height = card._futureHeight; // 赋予目标高度
                // 清理临时属性
                delete card._futureLayer; // 普通层级
                delete card._futureOriginalIndex; // 原始层级
                delete card._futureLeft; // 位置
                delete card._futureTop; // 位置
                delete card._futureWidth; // 宽度
                delete card._futureHeight; // 高度
            });

            this.initializeBlocking(); // 判断遮挡关系
            this.game.render(); // 渲染画面
        }, 1010); // 确保动画结束后再赋值
return cards;
}

