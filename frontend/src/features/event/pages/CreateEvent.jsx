import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar.jsx";
import Footer from "../../../components/Footer.jsx";
import { useEvent } from "../hooks/useEvent.js";
import { useWallet } from "../../wallet/hooks/useWallet.js";

const WEI_PER_ETH = 10n ** 18n;
const UINT96_MAX = (1n << 96n) - 1n;

const parseEthToWei = (value) => {
  const input = String(value).trim();
  const match = input.match(/^(\d+)(?:\.(\d{0,18}))?$/);
  if (!match) {
    throw new Error("Enter a valid ETH amount with no more than 18 decimal places.");
  }

  const wholeEth = BigInt(match[1]);
  const fractionalWei = BigInt((match[2] || "").padEnd(18, "0"));
  const wei = wholeEth * WEI_PER_ETH + fractionalWei;
  if (wei > UINT96_MAX) {
    throw new Error("Ticket price exceeds the maximum supported amount.");
  }

  return wei.toString();
};

const waitForTransactionReceipt = async (ethereum, transactionHash) => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const receipt = await ethereum.request({
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    });

    if (receipt) {
      if (BigInt(receipt.status) === 0n) {
        throw new Error("The wallet transaction failed on chain.");
      }
      return receipt;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    "The transaction is still pending. Please try again shortly.",
  );
};

const CreateEvent = () => {
  const { handleUploadEventImage, handleUploadMetadata, handleCreateEvent, loading, error } =
    useEvent();
  const { walletAddress, isLinked } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitStep, setSubmitStep] = useState("Creating event…");
  const [form, setForm] = useState({
    name: "",
    description: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    ticketLimit: "",
    ticketPrice: "0",
  });

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return undefined;
    }

    const previewURL = URL.createObjectURL(imageFile);
    setImagePreview(previewURL);
    return () => URL.revokeObjectURL(previewURL);
  }, [imageFile]);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setPageError(null);
    setCreatedEvent(null);

    if (!walletAddress || !isLinked) {
      setPageError(
        "Connect the wallet linked to your creator account before creating an event.",
      );
      return;
    }

    let ticketPriceWei;
    try {
      ticketPriceWei = parseEthToWei(form.ticketPrice);
    } catch (err) {
      setPageError(err.message);
      return;
    }

    const ethereum = window.ethereum;
    if (!ethereum?.request) {
      setPageError(
        "No browser wallet found. Install or enable one to continue.",
      );
      return;
    }

    setSubmitting(true);
    try {
      let imageURI;
      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("Choose an image file.");
        }
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error("Choose an image smaller than 5 MB.");
        }
        setSubmitStep("Uploading image to Pinata…");
        const imageResult = await handleUploadEventImage(imageFile);
        if (!imageResult?.imageURI) return;
        imageURI = imageResult.imageURI;
      }

      setSubmitStep("Uploading event details…");
      const metadataResult = await handleUploadMetadata({
        name: form.name.trim(),
        description: form.description.trim(),
        ...(imageURI ? { image: imageURI } : {}),
        ...(form.venue.trim() ? { venue: form.venue.trim() } : {}),
      });
      if (!metadataResult?.metadataURI) return;

      const details = {
        startsAt: String(Math.floor(new Date(form.startsAt).getTime() / 1000)),
        endsAt: String(Math.floor(new Date(form.endsAt).getTime() / 1000)),
        ticketLimit: form.ticketLimit,
        ticketPrice: ticketPriceWei,
        metadataURI: metadataResult.metadataURI,
      };

      setSubmitStep("Creating event…");
      const prepared = await handleCreateEvent(details);
      if (!prepared?.transaction) {
        if (prepared?.event) setCreatedEvent(prepared.event);
        return;
      }

      const [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!account || account.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error(
          "Switch your wallet to the address linked to your creator account.",
        );
      }

      const expectedChainId = `0x${BigInt(prepared.transaction.chainId).toString(16)}`;
      const currentChainId = await ethereum.request({ method: "eth_chainId" });
      if (currentChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: expectedChainId }],
        });
      }

      const transactionHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: prepared.transaction.to,
            data: prepared.transaction.data,
          },
        ],
      });

      await waitForTransactionReceipt(ethereum, transactionHash);
      const result = await handleCreateEvent({ ...details, transactionHash });
      if (result?.event) setCreatedEvent(result.event);
    } catch (err) {
      setPageError(
        err.response?.data?.message || err.message || "Could not create event.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loading;

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar />
      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
          {createdEvent ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-emerald-700">
                Event created
              </p>
              <h1 className="mt-2 text-3xl font-bold">{form.name}</h1>
              <p className="mt-3 text-slate-600">Your event is now recorded.</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">
                Create an event
              </h1>
              <p className="mt-2 text-slate-600">
                Add event details and publish it on the connected event
                contract.
              </p>

              {!isLinked && (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Connect the wallet linked to your creator account from the
                  navigation menu.
                </p>
              )}
              {(pageError || error) && (
                <p
                  className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                  role="alert"
                >
                  {pageError || error}
                </p>
              )}

              <form
                onSubmit={submitHandler}
                className="mt-7 grid gap-5 sm:grid-cols-2"
              >
                <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                  Event name
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    maxLength={160}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    required
                    rows={4}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                </label>
                <div className="grid gap-2 text-sm font-medium sm:col-span-2">
                  <label htmlFor="event-image">Event poster <span className="font-normal text-slate-500">(optional, PNG/JPG/WebP up to 5 MB)</span></label>
                  <input
                    id="event-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700"
                  />
                  {imagePreview && (
                    <div className="relative mt-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img src={imagePreview} alt="Selected event poster preview" className="h-48 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          const input = document.getElementById("event-image");
                          if (input) input.value = "";
                        }}
                        className="absolute right-2 top-2 rounded-lg bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-950"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>
                <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                  Venue{" "}
                  <span className="font-normal text-slate-500">(optional)</span>
                  <input
                    name="venue"
                    value={form.venue}
                    onChange={updateField}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Starts at
                  <input
                    name="startsAt"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={updateField}
                    required
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Ends at
                  <input
                    name="endsAt"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={updateField}
                    required
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Ticket limit
                  <input
                    name="ticketLimit"
                    type="number"
                    min="1"
                    step="1"
                    value={form.ticketLimit}
                    onChange={updateField}
                    required
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Ticket price (ETH)
                  <input
                    name="ticketPrice"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={form.ticketPrice}
                    onChange={updateField}
                    required
                    className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || !isLinked}
                  className="mt-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                >
                  {busy ? submitStep : "Create event"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default CreateEvent;
