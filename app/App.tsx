"use client";

import { fabric } from "fabric";

import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { useEffect, useRef, useState } from "react";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvasObjectScaling, handleCanvasSelectionCreated, handleCanvaseMouseMove, handlePathCreated, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { ActiveElement, Attributes } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {
  const undo = useUndo();
  const redo = useRedo();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef(false);

  const canvasObjects = useStorage((root) => root.canvasObjects)

  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width:'',
    height: '',
    fontSize: '',
    fontFamily: '',
    fontWeight: '',
    fill: '#aabbcc',
    stroke: '#aabbcc',
  });

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;

    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get('canvasObjects');

    canvasObjects.set(objectId, shapeData);
  }, []) 

  const [activeElements, setActiveElements] = useState<ActiveElement>({
    name:'',
    value: '',
    icon: '',
  });

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get('canvasObjects')

    if (!canvasObjects || canvasObjects.size === 0) return true

    for(const [ key, value ] of canvasObjects.entries()){
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({
    storage }, objectId) => {
      const canvasObject = storage.get('canvasObjects');

      canvasObject.delete(objectId);
    }, [])

  const handleActiveElement = (elem: ActiveElement ) => {
    setActiveElements(elem);

    switch (elem?.value) {
      case 'reset':
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElements(defaultNavElement);
        break;
      case 'delete':
        handleDelete(fabricRef.current as any, deleteShapeFromStorage)
        setActiveElements(defaultNavElement);
        break; 
      case 'image':
        imageInputRef.current?.click();
        isDrawing.current = false;

        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
      default:
        break;
    }

    selectedShapeRef.current = elem?.value as string;
  } 

  useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef })

    canvas.on("mouse:down", (options: any) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef
      })
    })

    canvas.on("mouse:move", (options: any) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage
      })
    })

    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElements,
        activeObjectRef
      })
    })

    canvas.on("object:modified", (options: any) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage
      })
    })

    canvas.on("selection:created", (options: any) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      })
    })

    canvas.on("object:scaling", (options: any) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes
      })
    })

    canvas.on("path:created", (options: any) => {
      handlePathCreated({
        options,
        syncShapeInStorage
      })
    })

    window.addEventListener("resize", () => {
      handleResize({ fabricRef })
    })

    window.addEventListener("keydown", (e: any) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    })

    return () => {
      canvas.dispose();
    }
  }, [])

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef
    })
  }, [canvasObjects])

  return (
    <main className="h-screen overflow-hidden">
      <Navbar
        activeElement={activeElements}
        handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e: any) => {
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          })
        }}
      />

      <section className="flex h-full flex-row">
        <LeftSidebar allShapes={Array.from(canvasObjects)}/>
        <Live canvasRef={canvasRef} undo={undo} redo={redo}/>
        <RightSidebar 
            elementAttributes={elementAttributes}
            setElementAttributes={setElementAttributes}
            fabricRef={fabricRef}
            isEditingRef={isEditingRef}
            activeObjectRef={activeObjectRef}
            syncShapeInStorage={syncShapeInStorage} 
        />
      </section>
    </main>
  );
}