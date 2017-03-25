"use strict";

import Inferno from 'inferno';

export const Nav = ({className, selectedName, links}) =>
    <nav className={className}>
        {Object.keys(links).map((key) =>
            <a className={selectedName ? selectedName === key ? "selected" : null : null} key={key} onClick={links[key]}>{key}</a>
        )}
    </nav>
;

export const Input = ({name, disabled, min, max, value, change_fn}) =>
    <section>
        <label for={name}>{name}</label>
        <input min={min} max={max} name={name} value={value} disabled={disabled} onInput={change_fn}/>
    </section>
;
