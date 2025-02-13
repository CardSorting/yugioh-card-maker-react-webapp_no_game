import { useState, useEffect, useRef, MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CardCreationService } from '../services/card/cardCreationService';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { CardState, CardMeta, UI } from '../types/card';
import { CardDrawer } from '../utils/CardDrawer';
import ui from '../assets/lang.ui.json';
import cardMeta from '../assets/lang.card_meta.json';
import ygoproData from '../assets/ygo/card_data.json';

const typedCardMeta = cardMeta as { [key: string]: CardMeta };
const typedUi = ui as UI;
const typedYgoproData = ygoproData as { [key: string]: any };

const CreateCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const yugiohCardRef = useRef<HTMLCanvasElement>(null);
  const yugiohCardWrapRef = useRef<HTMLDivElement>(null);
  const [cardState, setCardState] = useState<CardState>({
    uiLang: 'en',
    cardLang: 'en',
    holo: true,
    cardRare: '0',
    cardLoadYgoProEnabled: true,
    cardKey: '',
    cardTitle: '',
    cardImg: null,
    cardType: 'Monster',
    cardSubtype: 'Normal',
    cardEff1: 'normal',
    cardEff2: 'none',
    cardAttr: 'LIGHT',
    cardCustomRaceEnabled: false,
    cardCustomRace: '',
    cardRace: 'dragon',
    Pendulum: true,
    Special: true,
    cardLevel: '12',
    cardBLUE: 12,
    cardRED: 12,
    pendulumSize: 23,
    cardPendulumInfo: '',
    links: {
      1: { val: false, symbol: '◤' },
      2: { val: false, symbol: '▲' },
      3: { val: false, symbol: '◥' },
      4: { val: false, symbol: '◀' },
      6: { val: false, symbol: '▶' },
      7: { val: false, symbol: '◣' },
      8: { val: false, symbol: '▼' },
      9: { val: false, symbol: '◢' },
    },
    infoSize: '22',
    cardInfo: '',
    cardATK: '?',
    cardDEF: '?',
  });

  const location = useLocation();
  const { generatedImageUrl } = location.state || {};

  useEffect(() => {
    loadDefaultData();
    drawCard();

    // Handle generated image if provided
    if (generatedImageUrl) {
      // Update generation record to mark it as used
      CardCreationService.updateGenerationStatus(generatedImageUrl).catch(console.error);

      // Load the image
      fetch(generatedImageUrl)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], 'generated-card-art.png', { type: 'image/png' });
          setCardState(prev => ({ ...prev, cardImg: file }));
          drawCard();
        })
        .catch(console.error);
    }
  }, []);

  const loadDefaultData = () => {
    const data = typedCardMeta[cardState.cardLang].Default;
    setCardState(prev => ({
      ...prev,
      holo: true,
      cardRare: '0',
      titleColor: '#000000',
      cardLoadYgoProEnabled: true,
      cardKey: '',
      cardTitle: data.title,
      cardImg: null,
      cardType: 'Monster',
      cardSubtype: 'Normal',
      cardAttr: 'LIGHT',
      cardEff1: 'normal',
      cardEff2: 'none',
      cardCustomRaceEnabled: false,
      cardCustomRace: '',
      cardRace: 'dragon',
      Pendulum: true,
      Special: true,
      cardLevel: '12',
      cardBLUE: 12,
      cardRED: 12,
      links: {
        1: { val: false, symbol: '◤' },
        2: { val: false, symbol: '▲' },
        3: { val: false, symbol: '◥' },
        4: { val: false, symbol: '◀' },
        6: { val: false, symbol: '▶' },
        7: { val: false, symbol: '◣' },
        8: { val: false, symbol: '▼' },
        9: { val: false, symbol: '◢' },
      },
      cardInfo: data.info,
      infoSize: String(data.size),
      cardPendulumInfo: data.pInfo,
      pendulumSize: Number(data.pSize),
      cardATK: '?',
      cardDEF: '?',
    }));
  };

  const loadYgoproData = (key: string): boolean => {
    const data = typedYgoproData[key];
    if (!data) return false;

    setCardState(prev => ({
      ...prev,
      cardLang: prev.cardLang,
      cardRare: data.rare,
      cardTitle: data.title,
      cardImg: null,
      cardType: data.type[0],
      cardSubtype: data.type[1],
      cardAttr: data.attribute !== 'Trap' && data.attribute !== 'Spell' ? data.attribute : prev.cardAttr,
      cardEff1: data.type[2],
      cardEff2: data.type[3],
      cardCustomRaceEnabled: false,
      cardCustomRace: '',
      cardRace: data.race,
      Pendulum: data.type[4],
      Special: data.type[5],
      cardLevel: data.level,
      cardBLUE: data.blue,
      cardRED: data.red,
      links: {
        1: { val: data.link1, symbol: '◤' },
        2: { val: data.link2, symbol: '▲' },
        3: { val: data.link3, symbol: '◥' },
        4: { val: data.link4, symbol: '◀' },
        6: { val: data.link6, symbol: '▶' },
        7: { val: data.link7, symbol: '◣' },
        8: { val: data.link8, symbol: '▼' },
        9: { val: data.link9, symbol: '◢' },
      },
      cardInfo: data.infoText,
      infoSize: data.size,
      cardPendulumInfo: data.pendulumText,
      pendulumSize: data.pSize,
      cardATK: data.atk || '?',
      cardDEF: data.def || '?',
    }));
    return true;
  };

  const handleCardMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!yugiohCardWrapRef.current) return;

    const THRESHOLD = 5;
    const { clientX, clientY, currentTarget } = e;
    const { clientWidth, clientHeight, offsetLeft, offsetTop } = currentTarget;

    const horizontal = (clientX - offsetLeft) / clientWidth;
    const vertical = (clientY - offsetTop) / clientHeight;

    const rotateX = (THRESHOLD / 2 - horizontal * THRESHOLD).toFixed(2);
    const rotateY = (vertical * THRESHOLD - THRESHOLD / 2).toFixed(2);

    yugiohCardWrapRef.current.style.transform = `perspective(${clientWidth}px) rotateX(${rotateY}deg) rotateY(${rotateX}deg) scale3d(1, 1, 1)`;
  };

  const handleCardLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!yugiohCardWrapRef.current) return;
    yugiohCardWrapRef.current.style.transform = `perspective(${e.currentTarget.clientWidth}px) rotateX(0deg) rotateY(0deg)`;
  };

  const drawCard = async () => {
    if (!yugiohCardRef.current) return;

    const drawer = new CardDrawer(yugiohCardRef.current);
    const cardTemplateText = cardState.cardType !== "Monster" ?
      cardState.cardType :
      cardState.cardSubtype;

    try {
      await drawer.drawCard({
        templateLang: typedCardMeta[cardState.cardLang]._templateLang,
        cardTemplateText: cardTemplateText + (cardState.Pendulum ? "Pendulum" : ""),
        holo: cardState.holo,
        cardImg: cardState.cardImg,
        Pendulum: cardState.Pendulum,
        isXyzMonster: cardState.cardType === 'Monster' && cardState.cardSubtype === 'Xyz',
        isLinkMonster: cardState.cardType === 'Monster' && cardState.cardSubtype === 'Link',
        cardLevel: parseInt(cardState.cardLevel),
        cardRare: cardState.cardRare,
        cardTitle: cardState.cardTitle,
        cardType: cardState.cardType,
        cardAttr: cardState.cardAttr,
        cardKey: cardState.cardKey,
        links: cardState.links,
        cardBLUE: cardState.cardBLUE,
        cardRED: cardState.cardRED,
        pendulumSize: cardState.pendulumSize,
        cardPendulumInfo: cardState.cardPendulumInfo,
        infoSize: parseInt(cardState.infoSize),
        cardInfo: cardState.cardInfo,
        offset: typedCardMeta[cardState.cardLang]._offset,
        fontName: typedCardMeta[cardState.cardLang]._fontName,
        cardATK: cardState.cardATK,
        cardDEF: cardState.cardDEF,
      });
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  return (
    <Container fluid className="mt-5 mb-3 h-100 py-3 py-md-5 px-0 px-sm-5 create-card-container">
      <Row className="h-100 justify-content-center align-content-center">
        {/* Card Drawing Area */}
        <Col id="card-panel" xs={12} md={6} lg={4} className="mt-3 mt-sm-5 mt-md-0">
          <div className={`padding-transition sticky-top pt-5`}>
            <div className={`padding-transition pt-5`}>
              <div className="panel-bg shadow p-3">
                <div
                  id="yugiohcard-wrap"
                  ref={yugiohCardWrapRef}
                  className="card-body"
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                >
                  <canvas
                    id="yugiohcard"
                    ref={yugiohCardRef}
                    className="cardbg img-fluid"
                  />
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Card Form Area */}
        <Col id="data-panel" xs={12} md={6} lg={8} className="mt-3 mt-sm-5 mt-md-0">
          <div className="panel-bg shadow p-3">
            <div className="card-body">
              {/* Language Selection */}
              <Row className="mb-3">
                <Col>
                  <Form.Label>{typedUi[cardState.uiLang].ui_lang}</Form.Label>
                  <Form.Select
                    value={cardState.uiLang}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setCardState(prev => ({
                        ...prev,
                        uiLang: newLang,
                        cardLang: typedCardMeta[newLang] ? newLang : prev.cardLang
                      }));
                    }}
                  >
                    {Object.entries(typedUi).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.name || key}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {/* Card Key */}
              <Row className="my-3">
                <Col xs={6} lg={4} className="px-2">
                  <div className="px-0">
                    <Form.Label>{typedUi[cardState.uiLang].card_secret}</Form.Label>
                    <Form.Check
                      type="checkbox"
                      className={`checkbox-wrap ${cardState.cardLoadYgoProEnabled ? 'active' : ''}`}
                      label={typedUi[cardState.uiLang].auto_fill_card_data}
                      checked={cardState.cardLoadYgoProEnabled}
                      onChange={(e) => setCardState(prev => ({ ...prev, cardLoadYgoProEnabled: e.target.checked }))}
                    />
                  </div>
                </Col>
                <Col xs={6} lg={8} className="px-2">
                  <Form.Label>
                    <small>{typedUi[cardState.uiLang].card_secret_note}</small>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    maxLength={8}
                    placeholder={typedUi[cardState.uiLang].plz_input_card_secret}
                    value={cardState.cardKey}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      setCardState(prev => ({ ...prev, cardKey: newKey }));
                      if (cardState.cardLoadYgoProEnabled) {
                        loadYgoproData(newKey);
                      }
                    }}
                  />
                </Col>
              </Row>

              {/* Card Title */}
              <Row className="my-3">
                <Col className="px-2">
                  <Form.Label>{typedUi[cardState.uiLang].card_name}</Form.Label>
                  <Form.Control
                    type="text"
                    value={cardState.cardTitle}
                    onChange={(e) => setCardState(prev => ({ ...prev, cardTitle: e.target.value }))}
                  />
                </Col>
              </Row>

              <Row className="my-3">
                <Col className="px-2">
                  <Form.Group controlId="cardImage">
                    <Form.Label className="d-none">{typedUi[cardState.uiLang].upload_image}</Form.Label>
                    <div className="custom-file">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = (e.target as HTMLInputElement).files;
                            if (files && files[0]) {
                              setCardState(prev => ({ ...prev, cardImg: files[0] }));
                            }
                        }}
                        className="custom-file-input"
                      />
                      <Form.Label className="custom-file-label">
                        {cardState.cardImg ? cardState.cardImg.name : typedUi[cardState.uiLang].upload_image}
                      </Form.Label>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Card Options */}
              {/* ... (rest of the card form controls) */}
              <Row className="mb-3">
                    {/* Language */}
                    <Col xs={6} lg={3} className="px-2">
                      <Form.Label>{typedUi[cardState.uiLang].card_lang}</Form.Label>
                      <Form.Select
                        value={cardState.cardLang}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setCardState(prev => ({
                            ...prev,
                            cardLang: newLang,
                            ...(cardState.cardKey === '' && { cardTitle: typedCardMeta[newLang].Default.title })
                          }));
                        }}
                      >
                        {Object.entries(typedCardMeta).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value.name || key}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    {/* Foil */}
                    <Col xs={6} lg={3} className="px-2">
                      <Form.Label>{typedUi[cardState.uiLang].square_foil_stamp}</Form.Label>
                      <Form.Check
                        type="checkbox"
                        className={`checkbox-wrap ${cardState.holo ? 'active' : ''}`}
                        label={cardState.holo ? typedUi[cardState.uiLang].on : typedUi[cardState.uiLang].off}
                        checked={cardState.holo}
                        onChange={(e) => setCardState(prev => ({ ...prev, holo: e.target.checked }))}
                      />
                    </Col>

                    {/* Rarity */}
                    <Col xs={6} lg={3} className="px-2">
                      <Form.Label>{typedUi[cardState.uiLang].rarity}</Form.Label>
                      <Form.Select
                        value={cardState.cardRare}
                        onChange={(e) => setCardState(prev => ({ ...prev, cardRare: e.target.value }))}
                      >
                        <option value="0">N</option>
                        <option value="1">R</option>
                        <option value="2">UR</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  {/* Card Type */}
                  <Row className="my-3">
                    {/* Card Type */}
                    <Col xs={6} lg={3} className="px-2">
                      <Form.Label>{typedUi[cardState.uiLang].card_type}</Form.Label>
                      <Form.Select
                        value={cardState.cardType}
                        onChange={(e) => {
                          const newType = e.target.value as 'Monster' | 'Spell' | 'Trap';
                          setCardState(prev => ({
                            ...prev,
                            cardType: newType,
                            cardSubtype: 'Normal',
                            ...(newType !== 'Monster' && { Pendulum: false })
                          }));
                        }}
                      >
                        <option value="Monster">{typedUi[cardState.uiLang].monster_card}</option>
                        <option value="Spell">{typedUi[cardState.uiLang].spell_card}</option>
                        <option value="Trap">{typedUi[cardState.uiLang].trap_card}</option>
                      </Form.Select>
                    </Col>

                    {/* Card Subtype */}
                    <Col xs={6} lg={3} className="px-2">
                      <Form.Label>{typedUi[cardState.uiLang].card_subtype}</Form.Label>
                      <Form.Select
                        value={cardState.cardSubtype}
                        onChange={(e) => {
                          const newSubtype = e.target.value;
                          setCardState(prev => ({
                            ...prev,
                            cardSubtype: newSubtype,
                            ...(['Slifer', 'Ra', 'Obelisk', 'LDragon'].includes(newSubtype) && { Pendulum: false })
                          }));
                        }}
                      >
                        {cardState.cardType === 'Monster' ? (
                          Object.entries(typedUi[cardState.uiLang].m_card).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))
                        ) : (
                          Object.entries(typedUi[cardState.uiLang].st_card)
                            .filter(([key]) => cardState.cardType === 'Spell' || !['field', 'equip', 'quick', 'ritual'].includes(key))
                            .map(([key, value]) => (
                              <option key={key} value={key}>
                                {value}
                              </option>
                            ))
                        )}
                      </Form.Select>
                    </Col>

                    {/* Monster Effects */}
                    {cardState.cardType === 'Monster' && (
                      <>
                        <Col xs={6} lg={3} className="px-2">
                          <Form.Label>{typedUi[cardState.uiLang].card_effect}</Form.Label>
                          <Form.Select
                            value={cardState.cardEff1}
                            onChange={(e) => setCardState(prev => ({ ...prev, cardEff1: e.target.value }))}
                          >
                            {Object.entries(typedUi[cardState.uiLang].card_effect_opts)
                              .filter(([key]) => key !== 'none' && (key === 'normal' || key !== cardState.cardEff2))
                              .map(([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ))}
                          </Form.Select>
                        </Col>
                        <Col xs={6} lg={3} className="px-2">
                          <Form.Label>&emsp;</Form.Label>
                          <Form.Select
                            value={cardState.cardEff2}
                            onChange={(e) => setCardState(prev => ({ ...prev, cardEff2: e.target.value }))}
                          >
                            {Object.entries(typedUi[cardState.uiLang].card_effect_opts)
                              .filter(([key]) => key === 'normal' || key !== cardState.cardEff1)
                              .map(([key, value]) => (
                                <option key={key} value={key}>
                                  {key === 'normal' && typedUi[cardState.uiLang].m_card && typedUi[cardState.uiLang].m_card.effect ? typedUi[cardState.uiLang].m_card.effect : value}
                                </option>
                              ))}
                          </Form.Select>
                        </Col>
                      </>
                    )}
                  </Row>

                  {/* Monster Attribute and Race */}
                  <Row className="my-3">
                    {/* Attribute */}
                    {cardState.cardType === 'Monster' && (
                      <Col xs={12} lg={6} className="px-2">
                        <Form.Label>{typedUi[cardState.uiLang].card_attribute}</Form.Label>
                        <Form.Select
                          value={cardState.cardAttr}
                          onChange={(e) => setCardState(prev => ({ ...prev, cardAttr: e.target.value }))}
                        >
                          {Object.entries(typedUi[cardState.uiLang].card_attr_opts).map(([key, value]) => (
                            <option key={key} value={key.toUpperCase()}>
                              {value}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    )}

                    {/* Race Toggle and Selection */}
                    {cardState.cardType === 'Monster' && (
                      <Col xs={12} lg={6} className="px-2">
                        <Form.Label>{typedUi[cardState.uiLang].card_race_type}</Form.Label>
                        <div className="d-flex align-items-center">
                          <Form.Check
                            type="checkbox"
                            id="customRaceToggle"
                            className="me-2"
                            checked={cardState.cardCustomRaceEnabled}
                            onChange={(e) => setCardState(prev => ({ ...prev, cardCustomRaceEnabled: e.target.checked }))}
                          />
                          <Form.Label htmlFor="customRaceToggle" className="me-2">
                            {typedUi[cardState.uiLang].custom}
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder={typedUi[cardState.uiLang].plz_input_race_type}
                            value={cardState.cardCustomRace}
                            onChange={(e) => setCardState(prev => ({ ...prev, cardCustomRace: e.target.value }))}
                            disabled={!cardState.cardCustomRaceEnabled}
                            className="flex-grow-1"
                          />
                          <Form.Select
                            value={cardState.cardRace}
                            onChange={(e) => setCardState(prev => ({ ...prev, cardRace: e.target.value }))}
                            disabled={cardState.cardCustomRaceEnabled}
                            className="ms-2"
                          >
                            {Object.values(typedCardMeta[cardState.cardLang].Race).map((race) => (
                              <option key={race} value={race}>
                                {race}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </Col>
                    )}
                  </Row>

                  {/* ATK/DEF Fields */}
                  {cardState.cardType === 'Monster' && (
                    <Row className="my-3">
                      <Col xs={6} className="px-2">
                        <Form.Label>{typedUi[cardState.uiLang].attack}</Form.Label>
                        <Form.Control
                          type="text"
                          maxLength={6}
                          value={cardState.cardATK}
                          onChange={(e) => setCardState(prev => ({ ...prev, cardATK: e.target.value }))}
                        />
                      </Col>
                      {cardState.cardSubtype !== 'Link' && (
                        <Col xs={6} className="px-2">
                          <Form.Label>{typedUi[cardState.uiLang].defence}</Form.Label>
                          <Form.Control
                            type="text"
                            maxLength={6}
                            value={cardState.cardDEF}
                            onChange={(e) => setCardState(prev => ({ ...prev, cardDEF: e.target.value }))}
                          />
                        </Col>
                      )}
                    </Row>
                  )}

                  {/* Pendulum Effect */}
                  {cardState.Pendulum && (
                    <Row className="my-3">
                      <Col className="px-2">
                        <Form.Label>{typedUi[cardState.uiLang].pendulum_area}</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={cardState.cardPendulumInfo}
                          onChange={(e) => setCardState(prev => ({ ...prev, cardPendulumInfo: e.target.value }))}
                        />
                      </Col>
                    </Row>
                  )}

                  {/* Card Effect */}
                  <Row className="my-3">
                    <Col className="px-2">
                        <Form.Label>{typedUi[cardState.uiLang].card_info_text}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={cardState.cardInfo}
                        onChange={(e) => setCardState(prev => ({ ...prev, cardInfo: e.target.value }))}
                      />
                    </Col>
                  </Row>

                  {/* Generate and Download Buttons */}
                  <Row className="my-3">
                    <Col className="px-2 d-flex justify-content-between align-items-center">
                      <div>
                        <Button
                          variant="info"
                          className="my-2 me-2"
                          onClick={() => drawCard()}
                        >
                          {typedUi[cardState.uiLang].generate}
                        </Button>
                        <Button
                          variant="success"
                          className="my-2 me-2"
                          onClick={() => {
                            if (!yugiohCardRef.current) return;
                            const link = document.createElement('a');
                            link.download = 'YuGiOh.jpg';
                            link.href = yugiohCardRef.current.toDataURL('image/jpeg');
                            link.click();
                          }}
                        >
                          {typedUi[cardState.uiLang].download}
                        </Button>
                        {user && (
                          <Button
                            variant="primary"
                            className="my-2 me-2"
                            onClick={async () => {
                              if (!yugiohCardRef.current || !user) return;
                              
                              try {
                                // Convert canvas to blob
                                const blob = await new Promise<Blob>((resolve) => {
                                  yugiohCardRef.current?.toBlob((blob) => {
                                    if (blob) resolve(blob);
                                  }, 'image/jpeg');
                                });

                                // Save card using service
                                await CardCreationService.saveCard(user.id, cardState, blob);
                                alert('Card saved successfully!');
                                navigate('/profile');
                              } catch (error) {
                                console.error('Error saving card:', error);
                                alert('Error saving card. Please try again.');
                              }
                            }}
                          >
                            Save to Collection
                          </Button>
                        )}
                        <span style={{ color: '#CCC' }}>{typedUi[cardState.uiLang].auto_gen_note}</span>
                      </div>
                    </Col>
                  </Row>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateCard;
