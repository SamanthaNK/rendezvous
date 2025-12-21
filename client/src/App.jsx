import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-bright-snow flex flex-col">
          <Navbar />

          <main className="flex-1 pt-20">
            <Routes>
              <Route path="/" element={
                <div className="container-custom py-20">
                  <h1 className="font-heading text-4xl md:text-6xl font-bold text-ink-black mb-6">
                    Discover Events in Cameroon
                  </h1>
                  <p className="font-body text-lg text-gray-600 max-w-2xl">
                    Find concerts, festivals, workshops, and more happening near you.
                  </p>
                </div>
              } />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;