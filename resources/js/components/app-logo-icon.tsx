export default function AppLogoIcon({ className }: { className?: string }) {
    return (
        <img
            src="/images/lmu-logo.png"
            alt="Landmark University"
            className={className}
            style={{ objectFit: 'contain' }}
        />
    );
}
