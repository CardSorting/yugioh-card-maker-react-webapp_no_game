import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DeckList } from '../components/deck/DeckList';
import { useDeckActions } from '../hooks/deck/useDeckActions';
import { DeckDetails } from '../types/deck';

export const Decks = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deckName, setDeckName] = useState('');
  const { loading, error, createDeck, getUserDecks } = useDeckActions();
  const [decks, setDecks] = useState<DeckDetails[]>([]);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    const userDecks = await getUserDecks();
    setDecks(userDecks);
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) return;

    const deck = await createDeck({ name: deckName.trim() });
    if (deck) {
      setDeckName('');
      setShowCreateModal(false);
      await loadDecks(); // Refresh the deck list
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <DeckList 
          decks={decks}
          onCreateDeck={() => setShowCreateModal(true)}
          onDeckDeleted={loadDecks}
        />

        {/* Create Deck Modal */}
        <Transition appear show={showCreateModal} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={() => setShowCreateModal(false)}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Create New Deck
                    </Dialog.Title>

                    <form onSubmit={handleCreateDeck} className="mt-4">
                      {error && (
                        <div className="mb-4 p-3 rounded bg-red-50 text-red-500 text-sm">
                          {error}
                        </div>
                      )}

                      <div className="mb-4">
                        <label
                          htmlFor="deckName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Deck Name
                        </label>
                        <input
                          type="text"
                          id="deckName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter deck name"
                          value={deckName}
                          onChange={(e) => setDeckName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => setShowCreateModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            loading || !deckName.trim()
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          disabled={loading || !deckName.trim()}
                        >
                          {loading ? 'Creating...' : 'Create Deck'}
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default Decks;
