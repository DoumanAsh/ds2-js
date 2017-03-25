"use strict";

import {saveAs} from 'file-saver';

import Inferno, {linkEvent} from 'inferno';
import Component from 'inferno-component';

import Save from '../js/Save.js';
import {Nav, Input} from './App/Sub.jsx';


export default class App extends Component {
    constructor(props) {
        super(props);
        this.refs = {
            file_input: null
        };

        this.state = {
            view: {
                current: "General",
                Party: {
                    name: "First",
                    idx: 0
                }
            },
            save: {
                not_loaded: true
            }
        };

        this.open_save = () => this.refs.file_input.click();
        this.save_as = () => {
            if (this.save.inner) {
                saveAs(this.save.inner.blob(), this.save.inner.name);
            }
        };
        this.nav_menu = {
            "Open save": this.open_save,
            "Save as": this.save_as
        };

        this.set_view = (event) => this.setState((prev) => {
            prev.view.current = event.target.innerHTML;
            return prev;
        });
        this.nav_save = {
            "General": this.set_view,
            "Party": this.set_view
        };

        this.on_input = (event) => {
            let value = parseInt(event.target.value);

            let name = event.target.name;
            let arg = name;
            let idx = this.state.view.Party.idx;
            let max;

            if (name in this.save.map) {
                max = this.save.map[name].max;
            }
            else {
                max = this.save.map[this.state.view.current][name].max;
                name = this.state.view.current;
            }

            const old_value = this.save.get(name, arg, idx);

            if (isNaN(value)) value = 0;
            else if (value > max) value = max;

            if (old_value !== value) {
                this.save.set(name, value, arg, idx);
                this.forceUpdate();
            }
        };

        this.save = {
            inner: undefined,
            map_idx: { //Offset to use as idx*offset
                "Party": 0x24
            },
            set: function(name, value, arg, idx) {
                const map = this.map[name];

                if ('set' in map) {
                    map.set(arg, idx, value);
                }
                else {
                    this.inner.set_int(map.offset, map.len, value);
                }
            },
            get: function(name, arg, idx) {
                if (this.inner === undefined) return null;

                const map = this.map[name];

                if ('get' in map) {
                    return map.get(arg, idx);
                }
                else {
                    return this.inner.get_int(map.offset, map.len);
                }
            },
            map: {
                "Macca": {
                    offset: 0x6C4,
                    len: 4,
                    max: 0xFFFFFFFF,
                },
                "Party": {
                    set: (name, idx, value) => {
                        const map = this.save.map.Party[name];
                        let offset = map.offset + idx * this.save.map.Party.idx_offset;

                        this.save.inner.set_int(offset, map.len, value);
                    },
                    get: (name, idx) => {
                        const map = this.save.map.Party[name];
                        let offset = map.offset + idx * this.save.map.Party.idx_offset;

                        return this.save.inner.get_int(offset, map.len);
                    },
                    idx_offset: 0x24,
                    "EXP": {
                        offset: 0x7C,
                        len: 2,
                        max: 0xFFFF
                    },
                    "HP": {
                        offset: 0x82,
                        len: 2,
                        max: 0x3E7
                    },
                    "MP": {
                        offset: 0x84,
                        len: 2,
                        max: 0x3E7
                    },
                    "STR": {
                        offset: 0x7E,
                        len: 1,
                        max: 0x28
                    },
                    "MAG": {
                        offset: 0x7F,
                        len: 1,
                        max: 0x28
                    },
                    "VIT": {
                        offset: 0x80,
                        len: 1,
                        max: 0x28
                    },
                    "AGI": {
                        offset: 0x81,
                        len: 1,
                        max: 0x28
                    },
                    "MOVE": {
                        offset: 0x9F,
                        len: 1,
                        max: 0x28
                    }
                }
            }
        };
    }

    load_save(self, event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onerror = (event) => {
            switch (event.target.error.code) {
                case event.target.error.NOT_FOUND_ERR:
                    alert('File Not Found!');
                    break;
                case event.target.error.NOT_READABLE_ERR:
                    alert('Cannot read file');
                    break;
                case event.target.error.ABORT_ERR:
                    break; // noop
                default:
                    alert('An error occurred reading this file.');
            }
        };

        reader.onloadend = (result) => {
            const save = new Save(file.name, result.target.result);

            if (save.is_ds2()) {
                self.save.inner = save;
                self.setState({save: { not_loaded: false}});
            }
            else {
                alert("Invalid Devil Survivor 2 RB save");
            }
        };

        reader.readAsArrayBuffer(file);
    }


    render_general() {
        const elements = ["Macca"];
        return (
            <section className="inputs">
                {elements.map((elem) =>
                    <Input name={elem} min={0}
                        change_fn={this.on_input}
                        max={this.save.map[elem].max}
                        value={this.save.get(elem)}
                        disabled={this.state.save.not_loaded}/>
                )}
            </section>
        );
    }

    render_party() {
        const elements = ["EXP", "HP", "MP", "STR", "MAG", "VIT", "AGI", "MOVE"];

        const get_setter = (value) => {
            return (event) => this.setState((prev) => {
                prev.view.Party.name = event.target.innerHTML;
                prev.view.Party.idx = value;
                return prev;
            });
        };

        const menu = {
            "First": get_setter(0),
            "Second": get_setter(1),
            "Third": get_setter(2),
            "Fourth": get_setter(3)
        };

        return (
            <div className="Party">
                <section className="inputs">
                    {elements.map((elem) =>
                        <Input name={elem} min={0}
                            change_fn={this.on_input}
                            max={this.save.map.Party[elem].max}
                            value={this.save.get("Party", elem, this.state.view.Party.idx)}
                            disabled={this.state.save.not_loaded}/>
                    )}
                </section>
                <Nav links={menu} className="save" selectedName={this.state.view.Party.name}/>
            </div>
        );
    }

    render_content() {
        const fn_name = `render_${this.state.view.current.toLowerCase()}`;
        return this[fn_name]();
    }

    render() {
        return (
            <div className="app">
                <input ref={input => this.refs.file_input = input}
                    onChange={linkEvent(this, this.load_save)}
                    type="file" className="hidden"/>
                <Nav links={this.nav_menu}/>
                <content>
                    <Nav className="save" selectedName={this.state.view.current} links={this.nav_save}/>
                    {this.render_content()}
                </content>
            </div>
        );
    }
}
