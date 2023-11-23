class Panel {
    private _src!: string;
    private _name!: string;
    constructor(src: string, name: string) {
      this._src = src;
      this._name = name;
    }
  
    setSrc(src: string): Panel {
      this._src = src;
      return this;
    }
  
    getSrc() {
      return this._src;
    }
  
    setName(name: string): Panel {
      this._name = name;
      return this;
    }
  
    getName() {
      return this._name;
    }
}

export default Panel;