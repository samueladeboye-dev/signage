export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-white">
                <img
                    src="/images/lmu-logo.png"
                    alt="Landmark University Logo"
                    className="size-8 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">LMU Digital Signage</span>
                <span className="truncate text-xs text-muted-foreground leading-tight">Landmark University</span>
            </div>
        </>
    );
}
