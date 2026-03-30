import Navbar from '../components/layout/Navbar';

const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            <main className="p-8 text-center mt-20">
                <h1 className="text-4xl font-serif text-primary mb-4">Bienvenida a Esencia</h1>
            </main>
        </div>
    );
};

export default DashboardPage;