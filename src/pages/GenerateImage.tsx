import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useImageGeneration } from '../hooks/image/useImageGeneration';
import { useVisionAnalysis } from '../hooks/image/useVisionAnalysis';
import { saveAs } from 'file-saver';

const GenerateImage = () => {
    const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    generatedImage,
    loading,
    error: generationError,
    generateAndStore
  } = useImageGeneration();

  const {
    analysis,
    analyzing,
    error: analysisError,
    analyzeAndReturnPrompt
  } = useVisionAnalysis();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleGenerate = async () => {
    try {
      await generateAndStore(prompt, referenceImage, analysis);
    } catch (err) {
      // Error handling is done within the hook
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!referenceImage) return;
    try {
      const promptFromAnalysis = await analyzeAndReturnPrompt(referenceImage);
      setPrompt(promptFromAnalysis);
    } catch (err) {
      // Error handling is done within the hook
    }
  };

  const characterCountColor = prompt.length > 900 ? (prompt.length > 1000 ? 'text-danger' : 'text-warning') : 'text-muted';

  return (
    <Container fluid className="mt-5 mb-3 h-100 py-3 py-md-5 px-0 px-sm-5">
      <Row className="h-100 justify-content-center align-content-center">
        <Col xs={12} md={8} lg={6}>
          <div className="panel-bg shadow p-3">
            <div className="card-body">
              <h2 className="text-center mb-4">Generate Image</h2>
              
              {/* Reference Image Upload */}
              <Form.Group className="mb-4">
                <Form.Label>Upload a reference image (optional)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </Form.Group>

              {/* Reference Image Preview and Analysis */}
              {referenceImage && (
                <div className="mb-4">
                  <img 
                    src={referenceImage} 
                    alt="Reference" 
                    className="img-fluid mb-3"
                    style={{ maxHeight: '200px' }}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleAnalyzeImage}
                    disabled={analyzing}
                    className="w-100"
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze Image for Prompt'}
                  </Button>
                </div>
              )}

              {/* Analysis Result */}
              {analysis && (
                <div className="mb-4 p-3 border rounded">
                  <h6>Image Analysis:</h6>
                  <p className="mb-2">{analysis}</p>
                </div>
              )}

              {/* Prompt Input */}
              <Form.Group className="mb-4">
                <Form.Label>Enter or edit your image prompt</Form.Label>
                <Form.Control
                  ref={textareaRef}
                  as="textarea"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the card image you want to generate..."
                  maxLength={1000}
                  style={{ overflowY: 'hidden' }}
                />
                <Form.Text className={`text-muted ${characterCountColor}`}>
                  {prompt.length}/1000 characters
                </Form.Text>
              </Form.Group>

              {/* Generate Button */}
              <div className="text-center mb-4">
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="w-100"
                >
                  {loading ? 'Generating...' : 'Generate Image'}
                </Button>
              </div>

              {/* Error Display */}
              {(generationError || analysisError) && (
                <div className="alert alert-danger" role="alert">
                  {generationError || analysisError}
                </div>
              )}

              {/* Generated Image Display */}
              {generatedImage && (
                <div className="text-center">
                  <img
                    src={generatedImage}
                    alt="Generated card art"
                    className="img-fluid mb-3"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  <div>
                    <Button
                      variant="primary"
                      onClick={() => saveAs(generatedImage, 'card-image.png')}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default GenerateImage;
