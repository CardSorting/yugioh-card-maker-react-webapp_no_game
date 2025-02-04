import { useCard } from '../store/CardContext';
import { Modal, Spinner } from 'react-bootstrap';

const LoadingDialog = () => {
  const { loadingDialogShow } = useCard();

  return (
    <Modal
      show={loadingDialogShow}
      centered
      backdrop="static"
      keyboard={false}
      contentClassName="bg-transparent border-0"
    >
      <Modal.Body className="text-center text-white">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Modal.Body>
    </Modal>
  );
};

export default LoadingDialog;
