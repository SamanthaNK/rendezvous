import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Container from './Container';

function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        company: [
            { label: 'About Us', path: '/about' },
            { label: 'Contact', path: '/contact' },
            { label: 'Careers', path: '/careers' },
        ],
        resources: [
            { label: 'Help Center', path: '/help' },
            { label: 'Community Guidelines', path: '/guidelines' },
            { label: 'Terms of Service', path: '/terms' },
            { label: 'Privacy Policy', path: '/privacy' },
        ],
        organizers: [
            { label: 'Create Event', path: '/create-event' },
            { label: 'Organizer Dashboard', path: '/organizer/dashboard' },
            { label: 'Get Verified', path: '/verification' },
        ],
    };

    const socialLinks = [
        { icon: Facebook, label: 'Facebook', url: '#' },
        { icon: Instagram, label: 'Instagram', url: '#' },
        { icon: Twitter, label: 'Twitter', url: '#' },
    ];

    return (
        <footer className="bg-ink-black text-white py-12 md:py-16 mt-20">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    <div>
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-lime-cream rounded-full" />
                            <span className="font-logo text-2xl font-semibold tracking-tight">
                                Rendezvous
                            </span>
                        </Link>
                        <p className="font-body text-sm text-white/70 mb-6 leading-relaxed">
                            Discover events in Cameroon. Find concerts, festivals, workshops, and more happening near you.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        className="w-10 h-10 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-heading text-lg font-semibold mb-4">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="font-body text-sm text-white/70 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-heading text-lg font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="font-body text-sm text-white/70 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-heading text-lg font-semibold mb-4">For Organizers</h3>
                        <ul className="space-y-3">
                            {footerLinks.organizers.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="font-body text-sm text-white/70 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-12 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="font-body text-sm text-white/50">
                            {currentYear} Rendezvous. All rights reserved.
                        </p>
                        <p className="font-body text-sm text-white/50">
                            Made with care in Cameroon
                        </p>
                    </div>
                </div>
            </Container>
        </footer>
    );
}

export default Footer;