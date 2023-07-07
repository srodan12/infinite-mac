import {useRef, useState} from "react";
import "./MacCDROMs.css";
import {
    type EmulatorCDROM,
    type EmulatorCDROMLibrary,
} from "./emulator/emulator-common";
import {Button, type ButtonProps} from "./Button";
import classNames from "classnames";
import {Dialog} from "./Dialog";
import {fetchCDROMInfo} from "./cdroms";
import {Input} from "./Input";

export function MacCDROMs({
    cdroms,
    onRun,
    buttonAppearance,
}: {
    cdroms: EmulatorCDROMLibrary;
    onRun: (cdrom: EmulatorCDROM) => void;
    buttonAppearance: ButtonProps["appearance"];
}) {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = () => setExpanded(value => !value);
    const className = classNames(
        "Mac-CDROMs",
        `Mac-CDROMs-${buttonAppearance}`,
        {
            "Mac-CDROMs-Expanded": expanded,
        }
    );

    return (
        <div className={className}>
            <div className="Mac-CDROMs-Title" onClick={toggleExpanded}>
                CD-ROMs
            </div>
            {expanded && (
                <MacCDROMsContents
                    cdroms={cdroms}
                    onRun={cdrom => {
                        setExpanded(false);
                        onRun(cdrom);
                    }}
                    buttonAppearance={buttonAppearance}
                />
            )}
        </div>
    );
}

function MacCDROMsContents({
    cdroms,
    onRun,
    buttonAppearance,
}: {
    cdroms: EmulatorCDROMLibrary;
    onRun: (cdrom: EmulatorCDROM) => void;
    buttonAppearance: ButtonProps["appearance"];
}) {
    const [search, setSearch] = useState("");
    const folderPaths = Array.from(Object.keys(cdroms)).sort();
    const cdromsByCategory: {[category: string]: EmulatorCDROM[]} = {};
    let lastCategory;
    for (const folderPath of folderPaths) {
        if (search && !folderPath.toLowerCase().includes(search)) {
            continue;
        }
        const cdrom = cdroms[folderPath];
        const category = folderPath.substring(
            0,
            folderPath.length - cdrom.name.length - 1
        );
        if (category !== lastCategory) {
            cdromsByCategory[category] = [];
            lastCategory = category;
        }
        cdromsByCategory[category].push(cdrom);
    }

    const [customCDROMVisible, setCustomCDROMVisible] = useState(false);

    return (
        <div className="Mac-CDROMs-Contents">
            {customCDROMVisible && (
                <MacCustomCDROM
                    onRun={onRun}
                    onDone={() => setCustomCDROMVisible(false)}
                    buttonAppearance={buttonAppearance}
                />
            )}
            <div className="Mac-CDROMs-Header">
                Load CD-ROM images into the emulated Mac to access software that
                is too large to pre-install on Infinite HD.
                <Button
                    appearance={buttonAppearance}
                    onClick={() => setCustomCDROMVisible(true)}>
                    Load from URL
                </Button>
                <Input
                    appearance={buttonAppearance}
                    type="search"
                    placeholder="Filter…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            {Object.entries(cdromsByCategory).map(([category, cdroms]) => (
                <div key={category} className="Mac-CDROMs-Category">
                    <h3>{category}</h3>
                    <div className="Mac-CDROMs-Category-Contents">
                        {cdroms.map(cdrom => (
                            <MacCDROM
                                key={cdrom.name}
                                cdrom={cdrom}
                                onRun={() => {
                                    onRun(cdrom);
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function MacCustomCDROM({
    onRun,
    onDone,
    buttonAppearance,
}: {
    onRun: (cdrom: EmulatorCDROM) => void;
    onDone: () => void;
    buttonAppearance: ButtonProps["appearance"];
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState("");
    const handleLoad = async () => {
        try {
            const cdrom = await fetchCDROMInfo(url);
            history.replaceState(
                {},
                "",
                location.pathname + "?cdrom_url=" + encodeURIComponent(url)
            );
            onRun(cdrom);
            onDone();
        } catch (err) {
            alert("Could not load CD-ROM: " + (err as Error).message);
        }
    };
    return (
        <Dialog
            title="Run Custom CD-ROM…"
            onDone={handleLoad}
            doneLabel="Run"
            doneEnabled={url !== "" && inputRef.current?.validity.valid}
            onCancel={onDone}
            buttonAppearance={buttonAppearance}>
            <p>
                Infinite Mac supports loading of CD-ROM images from URLs. Be
                aware of the following caveats:
            </p>
            <ul>
                <li>
                    The CD-ROM image must be a raw .iso file (i.e. not
                    compressed, not a .dmg or a .cue)
                </li>
                <li>
                    Only a subset of sites are supported (currently archive.org
                    and macintoshgarden.org). If there is another site that you
                    wish to be supported, please contact the maintainer. Be
                    aware that the HTTP server that serves the image has to
                    support{" "}
                    <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests">
                        range requests
                    </a>{" "}
                    so that the image can be streamed in.
                </li>
            </ul>
            <p>
                <Input
                    appearance={buttonAppearance}
                    className="Mac-Custom-CDROM-URL"
                    type="url"
                    value={url}
                    placeholder="URL"
                    size={40}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => {
                        if (
                            e.key === "Enter" &&
                            inputRef.current?.validity.valid
                        ) {
                            handleLoad();
                        }
                    }}
                    ref={inputRef}
                />
            </p>
        </Dialog>
    );
}

function MacCDROM({cdrom, onRun}: {cdrom: EmulatorCDROM; onRun: () => void}) {
    const {
        name,
        coverImageHash,
        coverImageSize,
        coverImageType = "round",
    } = cdrom;
    const [coverIamgeWidth, coverImageHeight] = coverImageSize;
    const coverImageUrl = `/Covers/${coverImageHash}.jpeg`;
    const coverClassName = classNames("Mac-CDROM-Cover", {
        "Mac-CDROM-Cover-Round": coverImageType === "round",
    });
    return (
        <div className="Mac-CDROM" onClick={onRun}>
            <img
                className={coverClassName}
                src={coverImageUrl}
                width={coverIamgeWidth}
                height={coverImageHeight}
                loading="lazy"
            />
            <div className="Mac-CDROM-Name">{name}</div>
        </div>
    );
}
