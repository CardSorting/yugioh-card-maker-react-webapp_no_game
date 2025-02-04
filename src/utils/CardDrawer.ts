export class CardDrawer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imgs: { [key: string]: HTMLImageElement } = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');
    this.ctx = context;
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private async loadImages(imgMap: { [key: string]: string }): Promise<void> {
    const promises = Object.entries(imgMap).map(async ([key, src]) => {
      this.imgs[key] = await this.loadImage(src);
    });
    await Promise.all(promises);
  }

  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    let lineWidth = 0 - this.ctx.measureText(text[0]).width;
    const fieldWidth = maxWidth;
    let initHeight = y;
    let lastSubStrIndex = 0;

    for (let i = 0; i < text.length; i++) {
      lineWidth += this.ctx.measureText(text[i]).width;
      if (lineWidth > fieldWidth || text.substring(i, i + 1) === '\n') {
        if (text.substring(i, i + 1) === '\n') i++;
        this.ctx.fillText(text.substring(lastSubStrIndex, i), x, initHeight);
        initHeight += lineHeight;
        lineWidth = 0;
        lastSubStrIndex = i;
      }
      if (i === text.length - 1) {
        this.ctx.fillText(text.substring(lastSubStrIndex, i + 1), x, initHeight);
      }
    }
  }

  public async drawCard(params: {
    templateLang: string;
    cardTemplateText: string;
    holo: boolean;
    cardImg: File | null;
    Pendulum: boolean;
    isXyzMonster: boolean;
    isLinkMonster: boolean;
    cardLevel: number;
    cardRare: string;
    cardTitle: string;
    cardType: string;
    cardAttr: string;
    cardKey: string;
    links: { [key: number]: { val: boolean } };
    cardBLUE: number;
    cardRED: number;
    pendulumSize: number;
    cardPendulumInfo: string;
    infoSize: number;
    cardInfo: string;
    cardATK: string;
    cardDEF: string;
    offset: any;
    fontName: string[];
  }) {
    const {
      templateLang,
      cardTemplateText,
      holo,
      cardImg,
      Pendulum,
      isXyzMonster,
      cardLevel,
      cardRare,
      cardTitle,
      cardType,
      cardAttr,
      cardKey,
      links,
      cardBLUE,
      cardRED,
      pendulumSize,
      cardPendulumInfo,
      infoSize,
      cardInfo,
      offset,
      fontName,
      cardATK,
      cardDEF,
      isLinkMonster
    } = params;

    // Set canvas dimensions
    this.canvas.width = 1000;
    this.canvas.height = 1450;

    // Prepare image sources
    let cardImgUrl = cardImg ? URL.createObjectURL(cardImg) : null;
    const imgSources = {
      template: `/static/images/card/${templateLang}/${cardTemplateText}.png`,
      holo: "/static/images/pic/holo.png",
      link1: "/static/images/pic/LINK1.png",
      link2: "/static/images/pic/LINK2.png",
      link3: "/static/images/pic/LINK3.png",
      link4: "/static/images/pic/LINK4.png",
      link6: "/static/images/pic/LINK6.png",
      link7: "/static/images/pic/LINK7.png",
      link8: "/static/images/pic/LINK8.png",
      link9: "/static/images/pic/LINK9.png",
      attr: cardType === "Monster" ? 
        `/static/images/attr/${templateLang}/${cardAttr}.webp` :
        `/static/images/attr/${templateLang}/${cardType}.webp`,
      photo: cardImgUrl || "/static/images/default.jpg",
      levelOrSubtype: cardType !== "Monster" ? 
        `/static/images/pic/${cardTemplateText}.webp` :
        `/static/images/pic/${isXyzMonster ? 'Rank' : 'Level'}.webp`,
    };

    // Load all images
    await this.loadImages(imgSources);

    // Draw main card image
    this.drawCardImg(Pendulum);

    // Draw card components
    this.drawCardTitle(cardTitle, offset, fontName, cardRare);
    this.drawCardElements(
      cardType,
      isXyzMonster,
      cardLevel,
      Pendulum,
      links,
      cardKey,
      holo,
      fontName,
      cardATK,
      cardDEF,
      isLinkMonster
    );

    if (Pendulum) {
      this.drawCardPendulumInfoText(
        cardBLUE,
        cardRED,
        cardPendulumInfo,
        pendulumSize,
        offset,
        fontName
    );
    }

    this.drawCardInfoText(cardInfo, infoSize, offset, fontName);

    // Cleanup
    if (cardImgUrl) URL.revokeObjectURL(cardImgUrl);
  }

  private drawCardImg(isPendulum: boolean) {
    let cX, cY, cW, cH;
    if (isPendulum) {
      cX = 69; cY = 255; cW = 862; cH = 647;
    } else {
      cX = 123; cY = 268; cW = 754; cH = 754;
    }

    const photo = this.imgs.photo;
    const iW = photo.width / photo.height * cH;
    const iH = photo.height / photo.width * cW;

    if (photo.width <= photo.height * (isPendulum ? 1.33 : 1)) {
      this.ctx.drawImage(photo, cX, cY - ((iH - cH) / 2), cW, iH);
    } else {
      this.ctx.drawImage(photo, cX - ((iW - cW) / 2), cY, iW, cH);
    }

    this.ctx.drawImage(this.imgs.template, 0, 0, 1000, 1450);
    this.ctx.drawImage(this.imgs.attr, 840, 68, 90, 90);
  }

  private drawCardTitle(cardTitle: string, offset: any, fontName: string[], cardRare: string) {
    this.ctx.font = `${57 + offset.tS}pt ${fontName[0]}, ${fontName[3]}, ${fontName[4]}, ${fontName[5]}`;
    this.ctx.fillStyle = this.getRareColor(cardRare);
    this.ctx.fillText(cardTitle, 77 + offset.tX, 140 + offset.tY, 750);
    this.ctx.shadowColor = "#000";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  private drawCardElements(
    cardType: string,
    isXyzMonster: boolean,
    cardLevel: number,
    isPendulum: boolean,
    links: { [key: number]: { val: boolean } },
    cardKey: string,
    holo: boolean,
    fontName: string[],
    cardATK: string,
    cardDEF: string,
    isLinkMonster: boolean
  ) {
    console.log("drawCardElements", {cardType});
    // Draw levels/ranks
    if (cardType === 'Monster' && !isXyzMonster) {
      for (let i = 1; i <= cardLevel; i++) {
        const x = isXyzMonster ? (122 + 15 + (i - 1) * 63) : (820 + 15 - (i - 1) * 63);
        this.ctx.drawImage(this.imgs.levelOrSubtype, x, 181, 58, 58);
      }
    }

    // Draw links if it's a Link monster
    const linkPosition = {
      Link: {
        X: [86, 410, 826, 70, 0, 878, 86, 410, 826],
        Y: [231, 214, 231, 556, 0, 556, 967, 1020, 967],
        W: [86, 177, 86, 52, 0, 52, 86, 177, 86],
        H: [86, 52, 86, 177, 0, 177, 86, 52, 86]
      },
      LinkPendulum: {
        X: [42, 421, 881, 21, 0, 934, 42, 421, 881],
        Y: [227, 211, 227, 732, 0, 732, 1319, 1365, 1319],
        W: [75, 155, 75, 46, 0, 46, 75, 155, 75],
        H: [75, 46, 75, 155, 0, 155, 75, 46, 75]
      }
    };

    const linkStr = isPendulum ? "LinkPendulum" : "Link";
    Object.entries(links).forEach(([key, value]) => {
      const i = parseInt(key);
      if (i !== 5 && value.val) {
        this.ctx.drawImage(
          this.imgs[`link${i}`],
          linkPosition[linkStr].X[i - 1],
          linkPosition[linkStr].Y[i - 1],
          linkPosition[linkStr].W[i - 1],
          linkPosition[linkStr].H[i - 1]
        );
      }
    });

    // Draw card key and holo
    if (cardKey) {
      this.ctx.fillStyle = isXyzMonster && !isPendulum ? '#FFF' : '#000';
      this.ctx.font = `22pt 'cardkey', 'MatrixBoldSmallCaps', ${fontName[2]}`;
      this.ctx.textAlign = "left";
      this.ctx.fillText(cardKey.padStart(8, '0'), 54, 1405);
    }
    
    if (holo) {
      this.ctx.drawImage(this.imgs.holo, 928, 1371, 44, 46);
    }

    // Draw ATK/DEF
    if (cardType === 'Monster') {
      // ATK
      this.ctx.font = cardATK.includes("∞") 
        ? `Bold 32pt 'Times New Roman', ${fontName[2]}`
        : `33pt 'MatrixBoldSmallCaps', ${fontName[2]}`;
      this.ctx.textAlign = "right";
      this.ctx.fillStyle = '#000';
      this.ctx.fillText(cardATK, 719, 1353, 95);

      // DEF / LINK
      if (isLinkMonster) {
        const linkCount = Object.values(links).filter(item => item.val).length;
        this.ctx.font = `28pt 'link', 'MatrixBoldSmallCaps', ${fontName[2]}`;
        this.ctx.fillText(String(linkCount), 917, 1352, 95);
      } else {
        this.ctx.font = cardDEF.includes("∞")
          ? `Bold 32pt 'Times New Roman', ${fontName[2]}`
          : `33pt 'MatrixBoldSmallCaps', ${fontName[2]}`;
        this.ctx.fillText(cardDEF, 920, 1353, 95);
      }
      this.ctx.textAlign = "left";
    }
  }

  private drawCardPendulumInfoText(
    blue: number,
    red: number,
    info: string,
    size: number,
    offset: any,
    fontName: string[]
  ) {
    this.ctx.textAlign = "center";
    this.ctx.font = "55pt 'MatrixBoldSmallCaps'";
    this.ctx.fillText(String(blue), 106, 1040, 60);
    this.ctx.fillText(String(red), 895, 1040, 60);
    
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    this.ctx.font = `${size}pt ${fontName[2]}, ${fontName[3]}, ${fontName[4]}, ${fontName[5]}`;
    this.wrapText(info, 160, 920 + offset.oY, 660, size + offset.lh);
  }

  private drawCardInfoText(info: string, size: number, offset: any, fontName: string[]) {
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    this.ctx.font = `${size}pt ${fontName[2]}, ${fontName[3]}, ${fontName[4]}, ${fontName[5]}`;
    this.wrapText(info, 75, 1095 + offset.oY, 825, size + offset.lh);
  }

  private getRareColor(rare: string): string | CanvasGradient {
    switch (rare) {
      case "2":
        this.ctx.shadowColor = "#dcff32";
        this.ctx.shadowBlur = 1;
        this.ctx.shadowOffsetX = 0.4;
        this.ctx.shadowOffsetY = 1.5;
        return "#524100";
      case "1":
        const gradient = this.ctx.createLinearGradient(0, 0, 600, 0);
        gradient.addColorStop(0, "#ffdabf");
        gradient.addColorStop(0.14, "#fff6bf");
        gradient.addColorStop(0.28, "#fffebf");
        gradient.addColorStop(0.42, "#d8ffbf");
        gradient.addColorStop(0.56, "#bfffd4");
        gradient.addColorStop(0.7, "#bffdff");
        gradient.addColorStop(0.84, "#bfe4ff");
        gradient.addColorStop(1, "#bfc2ff");
        return gradient;
      default:
        return "#000000";
    }
  }
}
