import { Link } from 'react-router-dom';
import { Github, Mail } from 'lucide-react';
import Container from './Container';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: 'Explore',
            links: [
                { label: 'Browse Events', path: '/' },
                { label: 'Find Your Vibe', path: '/search' },
            ],
        },
        {
            title: 'For Organizers',
            links: [
                { label: 'Create Event', path: '/events/create' },
                { label: 'Dashboard', path: '/organizer/dashboard' },
                { label: 'Get Verified', path: '/organizer/verification' },
            ],
        },
        {
            title: 'Legal & Boring Stuff',
            links: [
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
            ],
        },
    ];

    return (
        <footer className="bg-ink-black text-white py-12 mt-20">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-4 h-4 bg-lime-cream rounded-full" />
                            <span className="font-logo text-2xl font-semibold tracking-tight">
                                rendezvous
                            </span>
                        </Link>
                        <p className="font-body text-sm text-white/70 mb-4 leading-relaxed">
                            Discover events happening in Cameroon
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/SamanthaNK/rendezvous"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className="w-10 h-10 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="mailto:samanthank38@gmail.com"
                                aria-label="Email"
                                className="w-10 h-10 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Footer Links */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="font-heading text-base font-semibold mb-4">
                                {section.title}
                            </h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.path}>
                                        <Link
                                            to={link.path}
                                            className="font-body text-sm text-white/70 hover:text-white transition-colors inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="font-body text-sm text-white/50">
                            © {currentYear} Rendezvous. All rights reserved.
                        </p>
                        <p className="font-body text-sm text-white/50">
                            Made with care by S
                        </p>
                    </div>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;