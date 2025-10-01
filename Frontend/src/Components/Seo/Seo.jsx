import { useEffect } from "react";

function Seo({ template, product, collection, pageTitle, shopName }) {
    useEffect(() => {
        if (template.includes("product")) {
            document.title = `${product?.title} – ${shopName}`;
        } else if (template.includes("collection")) {
            document.title = `${collection?.title} – ${shopName}`;
        } else {
            document.title = `${pageTitle} – ${shopName}`;
        }
    }, [template, product, collection, pageTitle, shopName]);

    return null;
}

export default Seo;
