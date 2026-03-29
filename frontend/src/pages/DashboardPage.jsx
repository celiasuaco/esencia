import Navbar from '../components/layout/Navbar';

const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            <main className="p-8 text-center mt-20">
                <h1 className="text-4xl font-serif text-primary mb-4">Bienvenida a Esencia</h1>
                <p className="text-secondary max-w-md mx-auto italic">
                    Donde la elegancia se encuentra con la tradición. Explora nuestra colección de perfumes artesanales, creados con pasión y dedicación para ofrecerte una experiencia olfativa única. Cada fragancia es un viaje sensorial, diseñado para resaltar tu esencia y dejar una impresión duradera. Descubre tu aroma perfecto y déjate envolver por la magia de Esencia.
                </p>
            </main>
        </div>
    );
};

export default DashboardPage;