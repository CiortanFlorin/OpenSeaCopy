import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory} from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import { opend } from "../../../declarations/opend";
import Button from "./Button";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item(props) {

  const[name, setName] = useState();
  const[owner, setOWner] = useState();
  const[image, setImage] = useState();
  const[button, setButton] = useState();
  const[priceInput, setPriceInput] = useState();
  const[loaderHidden, setLoaderHidden] = useState(true);
  const[blur, setBlur] = useState();
  const[sellStatus, setSellStatus] = useState();
  const[priceLabel, setPriceLabel] = useState();
  const[shouldDisplay, setShouldDisplay] = useState(true);
  

  const id = props.id;

  const localHost = "http://172.22.115.219:8080/";
  const agent = new HttpAgent({host: localHost});
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    });

    const name = await NFTActor.getName();
    setName(name);

    const owner = await NFTActor.getOwuner();
    setOWner(owner.toText());

    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"})
    );
    setImage(image);
    
    if (props.role == "collection"){
    const nftIsListed = await opend.isListed(props.id);

    if(nftIsListed){
      setOWner("OpenD");
      setBlur({filter: "blur(4px)"});
      setSellStatus("Listed");
    } else{
    setButton(<Button handleClick={handleSell} text={"Sell"}/>);
    }
  } else if (props.role == "discover") {
    const originalOwner = await opend.getOriginalOwner(props.id);
    if (originalOwner != CURRENT_USER_ID.toText()) {
      setButton(<Button handleClick={handleBuy} text={"Buy"}/>);
    }

    const price = await opend.getListedNFTPrice(props.id);
    setPriceLabel(<PriceLabel sellPrice={price.toString()} />);
    

  }

  }

  useEffect(() => {
    loadNFT();
  }, []);

  let price;
  function handleSell() {
    setPriceInput(<input
      placeholder="Price in DANG"
      type="number"
      className="price-input"
      value={price}
      onChange={(e) => price=e.target.value}
    />);
    setButton(<Button handleClick={sellItem} text={"Confirm"}/>);
  }

  async function sellItem() {
    setBlur({filter: "blur(4px)"});
    setLoaderHidden(false);
    const listingResult = await opend.listItem(props.id, Number(price));
    if (listingResult == "Success") {
      const openDId = await opend.getOpenDCanistedID();
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log(transferResult);
      if (transferResult == "Success"){
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOWner("OpenD");
        setSellStatus("Listed");
      }
    }
  }

  async function handleBuy() {
    setLoaderHidden(false);
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("ai7t5-aibaq-aaaaa-aaaaa-c"),
    });

    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTPrice(props.id);
    const result = await tokenActor.transfer(sellerId, itemPrice);
    console.log(result);
    if (result == "Success"){
      const transferResult = await opend.completePurchase(props.id, sellerId, CURRENT_USER_ID);
      console.log("purchase: " + transferResult);
      setLoaderHidden(true);
      setShouldDisplay(false);
    }

  }

  return (
    <div style={{display: shouldDisplay ? "inline" : "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div hidden = {loaderHidden} className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
        {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
